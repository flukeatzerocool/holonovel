# Plan — Trust-core contract and citation repair (F-S1 + the F-S2 remainder)

Status: draft v2 (re-scoped at the user's direction: the unimplemented contracts
are implemented here; v2 resolves the cold pass on v1 — 2 Blockers, 3 Majors,
7 Minor/Nit, see Resolutions) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-14-trust-core-citation-repair/`
Rollback cost: 1 (one revert: three behavioural changes in `index.ts` — safety
ladder, register signal, pause directive — plus three harness files, two
Appendix F rows, DECISIONS records, register/roadmap bookkeeping)
Evidence class: repo
Trust boundary: every premise is read from the working tree at HEAD; no web,
user, or tool-output content enters the plan.
Cold pass: `/tmp/opencode/citation-repair-cold-review-v3.md`, reviewed plan
sha256 `1f33079ba16bc144ef9873fb443fec466af62366f124b94dc2228d49aef4856d`,
verdict FAILED (2 Blockers, 3 Majors, 7 Minor/Nit). v2 is unaudited by a second
cold pass (the standard-depth cap is one pass); every finding is resolved below.

## Resolutions (cold pass v1 → v2)

- **B1** The safety ladder now keys on **overkill**, not max HP, so it is defined
  for every target: `moderate` applies death only when damage strictly exceeds
  the target's remaining HP; `hardcore` applies it on any zeroing blow. With no
  declared death condition no tier can apply one; the response and audit say so
  and the tier degrades to incap. Both edges are in the Phase 1 probe and T350.
- **B2** Step 22 now refreshes the recorded budget line
  (`holonovel/DECISIONS.md:9`), which `scripts/surface-budget.ts:169-180` gates.
- **M1** The register bypasses `recordSignal`: it lives only in a module
  variable, never in `novel.player_signals`, and a hydrated legacy value is
  ignored. **M2** the objective is reconciled with D2. **M3** T109 keeps the
  Player-exclusion, end-combat-omission, entity-removal and scene-clear legs.
- **N1** an empty `value` resets the register to `character`. **N2** T212 guards
  `recapEntityStatus`, not the damage path. **N3** the roadmap removal is
  conditional. **N4** rollback cost counts three behavioural changes. **N5**
  "only combat-damage site", not "only HP-reduction site". **N6** the T336
  marker is the implementation string `[No active entity — knowledge state
  unavailable.]`. **N7** `tool-definitions-lint` joins the regeneration sequence.

## Questions

1. Which roadmap item is next? `ROADMAP.md:15-24` § *Trust-core citation
   repair (P1)* — review-register finding F-S1 (`spec/audit/review-register.md:2535-2541`):
   four §5.1/§5.5 REQs cite `Automated` Appendix F tests no harness implements.
2. What changed from draft v2? The user asked that the contracts those rows
   describe be **implemented in this increment** rather than scheduled: the
   autonomy `safety`-tier effect, the `register` player signal, and the
   `mechanical_prompt` pause. The plan therefore carries a behavioural build
   before the assertion work, and the former "F-S2 scheduled gap" becomes
   implemented contract plus a recorded reading (D6).

## Objective

Make every citation in F-S1 resolve to an assertion, and make the server
implement the contracts those rows promise — so each assertion is true because
the behaviour exists, not because the test was narrowed to the implementation.
The only narrowing the plan permits is the T109 group map (a test-definition
count, D2) and any group the harness cannot populate, which is recorded
`unprobed` rather than dropped.

| REQ | Check line | Cited test | State at HEAD | This increment |
|---|---|---|---|---|
| REQ-032b | `spec/02-requirements.md:1239` | T44 | no harness carries `T44` | write T44 |
| REQ-109f | `:1336` | T109, T110, T149 | T110/T149 exist; T109 does not | write T109 |
| REQ-286c | `:1355` | T336 | no harness carries `T336` | write T336 |
| REQ-306e | `:1309` | T350, T485 | T485 exists; T350 does not; safety/register/pause unimplemented | implement + write T350 |
| REQ-064f | `:242` | T51, T461 | T461 covers the boundary directive only; `register` absent | implement + extend T461 |

**Done bar:**

1. **Safety ladder.** `manage_combat (action: damage)` (the only
   combat-damage site — `holonovel/src/index.ts:7314`; `manage_character
   (action: update)` can also set `hp` directly and is not tier-governed)
   applies the autonomy `safety` tier on the **overkill** axis, which needs no
   max-health stat:
   - `safe` (the default) — HP floors at 0, the ruleset's incapacitation
     condition applies, the death condition is **never** applied. This is
     exactly today's behaviour.
   - `moderate` — the death condition applies only when damage **strictly
     exceeds** the target's remaining HP before the blow (`total > hpBefore`),
     and the response carries a warning line.
   - `hardcore` — the death condition applies on any zeroing blow
     (`total >= hpBefore`), with no warning line.
   With no declared death condition (`rulesetDeathCondition`, `:11619-11629`
   returns null) no tier can apply one: the response states
   `death condition unavailable (no ruleset declaration)`, the audit records
   `death_applied: false, death_unavailable: true`, and status stays
   `incapacitated`. Every response and audit entry names the tier and whether
   the death condition was applied (REQ-040a). T131 (`test-backfill.ts:2375`,
   damage/incap legs `:2443-2462`) and T161 stay green because the default tier
   preserves them; T212 is unaffected (it sets HP via
   `manage_character (action: update)`, `test-output-contracts.ts:2603,2612`,
   and guards `recapEntityStatus`, not this handler).
2. **Register signal.** `manage_character (action: signal)` accepts
   `register` with values `character` (default) or `meta`; any other non-empty
   value is `[INVALID_INPUT]`, and an empty `value` resets it to `character`
   (the existing empty-value-removal convention, `index.ts:5245-5248`). The
   value is session-scoped in a module variable beside `detailLevel`
   (`index.ts:2113`): it is **not** written to `novel.player_signals` (bypass
   `recordSignal`, `:5244-5255`), never hydrated from a Novel (a legacy
   persisted value is ignored), and resets on restart (REQ-064d/REQ-064f).
   `badge_briefing` renders a `Player register: <value>` line for every badge.
   Under `meta`, `run_command (action: suggest)` drops its
   `Actions for <name>:` framing (`index.ts:5842`) and returns the bare domain
   blocks; under `character` the framing stays. REQ-064c/d/f and the register
   clause of REQ-306e are thereby implemented.
3. **Mechanical pause.** At `level=mechanical_prompt` the `### Autonomy`
   briefing block (`index.ts:17419-17424`) carries the pause directive: call
   `manage_scene (action: choices)` with `[NEED_INPUT]` before resolving a
   ruleset-derived mechanic, and the human answers with `respond_decision`. At
   `level=full` the directive is absent. The decision surface round-trip
   (`manage_scene (action: choices)` → `respond_decision`) is asserted, so the
   mechanism the directive names is proven to work (D6).
4. **T44** runs in `holonovel/scripts/test-output-contracts.ts`: Player →
   `[FORBIDDEN]` naming `set_badge`, Game Master → succeeds, Player → refused
   again, Editor (`none`) → succeeds ungated; no GM-only content body leaks into
   the Player refusal.
5. **T109** runs in `holonovel/scripts/test-briefing.ts` against the
   REQ-109a/b/c group map, not the implementation: every mapped mandatory group
   has a rendered heading and every rendered heading maps to a group; an emptied
   source renders its marker; decision-critical headings precede supplementary
   ones. The row's other legs are kept: the Player badge sees the
   player-visible groups and none of the GM-only groups, ending combat omits the
   combat group, removing entities omits the entity group, and clearing scene
   state renders that group's empty-state marker (the Player combat-detail leg
   stays with T110). Groups the harness cannot populate are recorded `unprobed`
   in the AAR and excluded from the map — never silently dropped.
6. **T336** runs in `holonovel/scripts/test-briefing.ts`: reveal → the GM
   `### Knowledge state` lists the secret for the active entity; the
   not-present marker appears above retained knowledge; the no-active-entity
   marker (`[No active entity — knowledge state unavailable.]`, the
   implementation string at `index.ts:1003`, which the row is aligned to)
   appears; the Player sees only its own entity's knowledge.
7. **T350** runs in `holonovel/scripts/test-backfill.ts`: autonomy set returns
   `[OK]`; the GM briefing shows the four values and the pause directive at
   `mechanical_prompt`; the Player is refused; values persist across restart;
   the safety ladder is asserted for all three tiers through
   `manage_combat (action: damage)` — including the no-declared-death-condition
   branch (advisory + `death_unavailable: true` + `incapacitated`) and the
   no-max-stat target. "Remaining HP" is the primary health key's pre-damage
   value (`hpBefore`, `index.ts:7310`); when several health keys exist, the
   first in the `hp`/`current_hp`/`hit_points` precedence list governs the
   overkill comparison.
8. **T461** is extended at `test-output-contracts.ts:213` to assert the register
   line, the `meta` framing suppression, and the reset after restart.
9. **Spec and records.** Appendix F T350 and T461 rows are rewritten to the
   implemented assertions; T44/T109/T336 rows are aligned to their new tests;
   `holonovel/DECISIONS.md` records the safety ladder, the session-scoped
   register, and the mechanical-pause reading; F-S1 moves to `Resolved` with its
   false "absent from every harness" sentence corrected. F-S3 is written only if
   the T109 probe branches; the citation-repair roadmap section is removed
   unless F-S3 replaces it with its own scheduled section. The coverage
   register is regenerated.
10. **Gates.** `npm --prefix holonovel run test:all` is green; the AGENTS.md
    regeneration sequence is applied in order — `check-tool-definitions-sync`
    (regenerate on drift), `tool-definitions-lint`, `surface-budget --write` and
    `surface-replay --write` if the footprint moved, then the recorded budget
    line at `holonovel/DECISIONS.md:9` refreshed to the measured counts, then
    `npm run assemble`; `npm run check:fast` reports the trailing
    `check:fast: PASS`; and `check-registers`, `check-roadmap`,
    `check-loop-artifacts` pass.
11. One `npm run session:close` commit. Publication is out of scope.

## Premises (each read at HEAD)

**Baseline.** `npm run check:fast` is green this session (`41 passed, 0 failed`,
trailing `check:fast: PASS`); `npm run status` reports 83 unpushed commits and a
clean tree.

**Citation premises.** `T44`, `T109`, `T336`, `T350` appear in no
`holonovel/scripts` harness. T110 is at `test-backfill.ts:2300`; T149 at
`test-output-contracts.ts:2846`; T148 at `test-briefing.ts:104`; T9 at
`test-output-contracts.ts:589`; T348 at `:667`; T349 at `:677`; T485 at
`test-backfill.ts:1653`; T461 at `test-output-contracts.ts:213` (title
`T461/REQ-064 + T223/REQ-070 + T26/REQ-071: briefing orientation layer`). T44 is
additionally cited by handoff fixture H9 (`spec/06-artifacts.md:54`) and by the
Appendix P threat-model row
(`spec/appendices-reference.md:3240`), and its Appendix F row also maps
REQ-058 (`:1474`).

**Coverage resolver.** Exercised IDs come from executed `test("<name>")` calls
(`scripts/validate.ts:1431-1444`); sub-part REQs roll onto their 3-digit base
(`:1866`), so a phantom sub-part citation never surfaces as bucket B — the
reason F-S1 needed a manual sweep. Title rules: ≤4 IDs, ID before the colon
(`:1508-1546`).

**Damage path.** `manage_combat (action: damage)` reduces every present health
key with `Math.max(0, hp - total)` (`index.ts:7314`) and applies
`rulesetIncapacitationCondition` when the lowest key reaches 0 (`:7319-7324`);
it audits `roll_weapon_damage` with HP before/after and the condition
(`:7328-7340`). `rulesetDeathCondition` (`:11619-11629`) reads the package's
`death_condition`; `recapEntityStatus` (`:11631-11637`) reports `dead` only when
that condition is present, `unconscious` at 0 HP when a death condition is
declared but unapplied, `incapacitated` when none is declared. T131 asserts
`incapacitated` and the ruleset condition at 0 HP (`test-backfill.ts:2443-2462`)
and is the direct regression guard; T212 asserts the three recap statuses from
direct HP writes (`test-output-contracts.ts:2590-2617`) and does not exercise
this handler; T161 asserts the damage turn report (`test-backfill.ts:2471`) and
is checked in Phase 1 step 7 for exact-string collisions. This is why the `safe`
tier must remain today's behaviour (D4). `manage_character (action: update)`
shallow-merges `stats` (including `hp`, `:5008`) and is outside the tier's
scope.

**Autonomy surface.** `DEFAULT_AUTONOMY` is `mechanical_prompt`/`prompt`/`safe`/
`standard` (`holonovel/src/core/state.ts:697-703`) and `TTRPG_AUTONOMY` seeds it
(`:717-730`). The handler is `index.ts:8030-8051` (`requireGM`, four sliders,
safety escalation workflow, `[OK] Autonomy set — level: …`). The briefing block
is GM-only (`:17419-17424`); `spec_health` reports `autonomy` for the GM
(`:14901`). `mechanical_prompt` appears once in the server today, as a schema
enum (`:7785`).

**Register surface.** `manage_character (action: signal)` accepts `pace`,
`difficulty`, `tone`, `focus`, `boundary`, `detail`, `voice_feedback`
(`index.ts:5006`); `detail` and `voice_feedback` have special handling and the
rest go through `recordSignal` (`:5241-5287`). `detailLevel` (`:2113`) is the
precedent for session-scoped, non-persisted state. `run_command (action:
suggest)` renders `Actions for ${name}:` (`:5842`). `manage_ruleset (action:
search)` returns bare JSON (`:2443-2452`), so no lookup-side change is needed.

**Spec-project mechanics.** Appendix F rows: T44 `:1474`, T109 `:1581`, T350
`:1781`, T336 `:1797`, T461 `:1482`. §5.5 and Appendix F are outside
`scripts/lib/contract-fingerprint.ts`, so no fingerprint regeneration is
expected; `npm run assemble` is required. Tool-schema text changes (the signal
enum description) require the regeneration sequence in AGENTS.md
(`check-tool-definitions-sync`, then `surface-budget`/`surface-replay` only if
the footprint moves). `spec/audit/req-coverage.md` is freshness-gated inside
`validate`; regenerate with `npm run validate -- --write-register`.
`check-registers` requires every `REQ-\d{3}` token in a `Scheduled-roadmap`
finding to appear literally in `ROADMAP.md`
(`scripts/lib/register-checks.ts:64-68`). `docs/plans/` increments error on a
missing `aar.md`, so intermediate `check:fast` runs fail `check-loop-artifacts`
until step 24.

## Decisions

**D1 — write T44; do not re-point.** Two cross-references (H9, the threat-model
row) and a genuine Player→GM→Player plus Editor cycle no test asserts. Rejected:
re-point to T9/T148/T349 and delete the row (orphans both references).

**D2 — T109 asserts the REQ-109 group map bidirectionally, and the Appendix F
row is rewritten to that map.** The row's "16 groups" is a test-definition
count; the bar is "every mapped group has a heading, every heading maps to a
group". The row's other legs (Player exclusion, end-combat omission,
entity-removal omission, scene-clear marker) are kept. If a mandatory group is
not rendered, that is a contract gap: contingency finding **F-S3** with its own
roadmap section (spelling out the affected REQ IDs), and the row narrows to the
mapped groups — the one narrowing this plan permits, and only for a group the
implementation genuinely lacks. Rejected: asserting a literal count; asserting
without a probe; dropping the row's other legs.

**D3 — T336 is written beside T148/T707 in `test-briefing.ts`, not folded into
T707.** T707 never reveals a secret; a re-point would be false evidence.

**D4 — the safety tier governs death on the overkill axis, not the HP floor.**
`safe` = today's behaviour (HP floors at 0, incap condition, **no** death
condition); `moderate` = death condition only when damage strictly exceeds the
target's remaining HP (`total > hpBefore`), with a warning; `hardcore` = death
condition on any zeroing blow (`total >= hpBefore`), no warning. Overkill is
defined for every target and needs no max-health stat, so the tiers are distinct
even in the ruleset-free corpus (the cold-pass B1 defect in the earlier
"killing blow = max_hp" wording). With no declared death condition the tier
degrades explicitly (response advisory, audit flags), which is the honest
outcome rather than inventing a `dead` string `recapEntityStatus` would not
recognise. Rejected: the old Appendix F T350 wording's "safe clamps HP to 1"
(contradicts T131/T161, changes default play, not in the REQ body); a
max-HP-relative rule (undefined without `max_hp`); applying a synthetic death
condition (invisible to `recapEntityStatus`, `index.ts:11631-11637`). Existing
tests stay green against the `safe` default.

**D5 — the register is a session module variable, and `meta` suppresses the
suggest framing line.** REQ-064d says the register is session state discarded on
connection close and REQ-064f says it does not survive restart; a module
variable matches exactly (and `detailLevel` at `index.ts:2113` is the precedent
for session presentation state). The `register` branch must therefore **not**
fall through to `recordSignal` (`:5244-5255`), which writes
`novel.player_signals` — that path is what would make the value survive a
restart and fail REQ-064f. A hydrated `player_signals.register` is ignored, not
adopted. The observable suppression is the `Actions for <name>:` line on
`run_command (action: suggest)` — the only narrative framing on the surfaces
REQ-064d names (`manage_ruleset` search already returns bare JSON). Rejected:
persisting it in Novel state or reusing the `connection_counter` signal idiom
(both store in Novel state, forbidden by REQ-064f); a new tool (no REQ names
one); suppressing whole response bodies (loses mechanical content the REQ says
must remain).

**D6 — the `mechanical_prompt` pause is delivered as a briefing directive plus
the existing decision surface, not as a dispatcher refusal.** `DEFAULT_AUTONOMY`
is `mechanical_prompt`/`prompt`, so a refusal gate keyed on that level would
pause every ruleset resolution in every default session and break the harness
corpus outright — which cannot be the spec's intent when the same defaults are
what ships. The server-enforceable content of REQ-306c is: the four slider
values in briefing and `spec_health` (already true), the pause directive naming
`manage_scene (action: choices)` and `respond_decision`, and a working decision
surface. The plan asserts all three. Rejected: dispatcher-level refusal (breaks
default play and the harness corpus); an opt-in enforcement flag (invents a
§7.6 configuration surface with no REQ); deleting the clause. This reading is
recorded in `holonovel/DECISIONS.md` so it is reviewable rather than implicit.

**D7 — behaviour first, then assertions, one commit.** The safety/register/pause
changes land before the tests that assert them, so no assertion is written
against a behaviour that does not exist. One commit: the session changes the
spec (Appendix F) and the server together, which AGENTS.md treats as one spec
increment. The changed surface is larger than the ~300-line guidance; it is
declared here as one atomic increment (source + its evidence + its records)
rather than split across two sessions.

**D8 — no new gate.** A sub-part citation-resolution check is a new heuristic
over 381 base rows with an unmeasured false-positive rate. F-S1 is closed by the
assertions; the resolver limitation is P3 record-and-close in the AAR.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | safety ladder in the damage handler; `register` in the signal enum + session variable + briefing line + suggest framing; pause directive in the autonomy block | M |
| `holonovel/scripts/test-output-contracts.ts` | new T44 test; T461 extended for register | M |
| `holonovel/scripts/test-briefing.ts` | new T109 and T336 tests | M |
| `holonovel/scripts/test-backfill.ts` | new T350 test (safety ladder, autonomy, restart) | M |
| `spec/appendices-reference.md` | T350, T461 rows rewritten; T44/T109/T336 aligned | S |
| `holonovel/DECISIONS.md` | safety ladder, session register, pause reading; recorded surface-budget line (`:9`) refreshed after the footprint measurement | S |
| `spec/audit/review-register.md` | F-S1 `Resolved` (text corrected); chunk preamble; F-S3 if branched | S |
| `spec/audit/req-coverage.md` | regenerated | S |
| `ROADMAP.md` | citation-repair section removed; F-S3 section only if branched | S |
| `holonovel/tool-definitions.json` (and budget/replay baselines if moved) | regenerated | S |
| `CHANGELOG.md` | session entry | S |
| `docs/plans/2026-11-14-trust-core-citation-repair/{plan,tasks,aar}.md` | increment artifacts | M |
| `holonovel.md` | regenerated by `npm run assemble` | S |

## Phases

### Phase 0 — baseline and scaffold

1. Re-run `npm run status` and `npm run check:fast`; a red baseline stops the
   increment.
2. Create the increment directory with `plan.md` (this document) and
   `tasks.md`. `check:fast` will report one expected `check-loop-artifacts`
   failure until the AAR lands (step 24).

### Phase 1 — probes (no edits)

3. **T109 group probe.** Build a Novel populated for every REQ-109 group with a
   writable source (entity, NPC, countdown, triggered lore, scene description,
   `manage_scene (action: directive)`, active adventure content, combat), capture
   the GM briefing's `###` headings in order, and produce the group↔heading map.
   Groups with no harness-writable source are `unprobed` (AAR-listed, excluded);
   decision-critical/supplementary boundary = last decision-critical heading.
4. **T44 Editor probe.** Confirm `set_badge("none")` with an active Novel allows
   `manage_npc (action: create)` and record the Player refusal wording.
5. **T336 marker probe.** Confirm the marker strings at `index.ts:1003, 1084,
   1086` and the `Secret: <key> — <content>` line shape.
6. **T461 home probe.** Confirm the boundary-directive assertion at
   `test-output-contracts.ts:213`, so the register assertions extend it rather
   than duplicate it.
7. **Damage-fixture probe.** Confirm a ruleset with a declared `death_condition`
   is seedable (`seedDeathRuleset`, `test-output-contracts.ts:2592`), that a
   target with no max-health stat is reachable (the overkill rule must not need
   one), and that a ruleset with no declared death condition is reachable
   (`wave1test`). Also read T161's assertions (`test-backfill.ts:2471`) to
   confirm the new `safety_tier`/`death_applied` fields do not collide with its
   exact-string expectations.
7b. **Decision-surface probe.** Drive one `manage_scene (action: choices)` →
   `respond_decision` round-trip and record the response shapes, so the pause
   directive names a surface that demonstrably works (cold-pass Unknown 3).

### Phase 2 — behavioural implementation

8. Safety ladder in `manage_combat (action: damage)` per D4: tier read from
   `novel.autonomy.safety`; `safe` unchanged; `moderate` applies the death
   condition only on overkill; `hardcore` on any zeroing blow; with no declared
   condition, emit the advisory and audit `death_unavailable: true`. Response
   and audit carry `safety_tier`, `death_applied`, and the overkill flag.
9. Register: add `register` to the signal enum with value validation (empty
   value resets to `character`); bypass `recordSignal` and hold the value in a
   session module variable (default `character`); add the `Player register: …`
   briefing line for all badges; suppress the suggest framing line under `meta`.
10. Pause directive in the `### Autonomy` block when `level=mechanical_prompt`,
    naming `manage_scene (action: choices)` and `respond_decision`; absent at
    `level=full`.
11. `holonovel/DECISIONS.md`: record the safety ladder, the session-scoped
    register, and the D6 pause reading.
12. Run the affected suites on their own after each change:
    `npm --prefix holonovel run test:backfill` and `test:output-contracts`
    (the `safe`-tier regression guard, incl. T131/T161).

### Phase 3 — assertions

13. T44 in `test-output-contracts.ts` (done bar 4).
14. T109 and T336 in `test-briefing.ts` (done bars 5–6).
15. T350 in `test-backfill.ts` (done bar 7), including the three safety tiers
    and the restart persistence leg.
16. Extend T461 with the register line, `meta` suppression, and restart reset
    (done bar 8).
17. Run each changed harness until green.

### Phase 4 — spec and records

18. Rewrite Appendix F T350 and T461 rows to the assertions; align T44/T109/T336
    rows.
19. F-S1 → `Resolved` with its false sentence corrected and predicates
    recomputed; update the chunk preamble at `review-register.md:2530-2532`.
20. Add F-S3 only if Phase 1 step 3 branched, with its roadmap section spelling
    out the affected REQ IDs; otherwise remove the citation-repair roadmap
    section with no replacement (nothing left scheduled).
21. `npm run assemble && npm run validate -- --write-register`.

### Phase 5 — gates and close

22. Regeneration sequence, in order: `npm run check-tool-definitions-sync`
    (regenerate on drift with `npx tsx holonovel/scripts/generate-tool-definitions.ts`)
    → `npm run tool-definitions-lint` → `npm run surface-budget -- --write` and
    `npm run surface-replay -- --write` only if their checks report drift →
    refresh the recorded budget line at `holonovel/DECISIONS.md:9` to the
    measured counts (`scripts/surface-budget.ts:169-180` gates that line) →
    `npm run assemble`.
23. `npm --prefix holonovel run test:all`, then `npm run check:fast` (capture the
    un-piped exit code and the trailing `check:fast: PASS`), plus
    `check-registers`, `check-roadmap`, and `check-loop-artifacts`.
24. Write the `CHANGELOG.md` entry dated to the session; run
    `after-action-report`, write `aar.md` ending `LOOP PAUSED`, then
    `npm run session:close`.

## Verification

| Done bar | Evidence | Command |
|---|---|---|
| 1 safety ladder | three tiers; overkill boundary; no-max-stat target; no-death-condition advisory; `safe` default unchanged | `npm --prefix holonovel run test:backfill` |
| 2 register | enum + empty-value reset, briefing line, meta suppression, not in Novel state, restart reset | `npm --prefix holonovel run test:output-contracts` |
| 3 pause | directive present at `mechanical_prompt`, absent at `full`; choices round-trip | `test:backfill` + `test:output-contracts` |
| 4–6 T44/T109/T336 | new assertions, incl. T109's Player/end-combat/entity/scene legs | `test:output-contracts`, `test:briefing` |
| 7–8 T350/T461 | autonomy, safety, restart, register | `test:backfill`, `test:output-contracts` |
| 9 registers | fresh coverage register, cross-referenced rows, DECISIONS records | `npm run validate -- --write-register`, `check-registers`, `check-roadmap` |
| 10 gates | full suite + fast gate + regeneration + budget line | `npm --prefix holonovel run test:all`, `npm run check:fast` → trailing `check:fast: PASS` |

An assertion that fails because the implementation is wrong is fixed in the
implementation; the plan does not weaken an assertion to reach green. A leg
whose behaviour turns out absent becomes a scheduled finding and the AAR records
it.

## Risks and rollback

- **Default-behaviour regression.** The `safe` tier must be byte-for-byte
  today's damage behaviour; T131 and T161 are the guard and run before the new
  assertions (T212 guards `recapEntityStatus`, not the damage handler).
- **No declared death condition.** On such a ruleset the death tiers are
  unobservable by design; the advisory line and audit flags are the observable
  contract, and T350 asserts both branches.
- **Signal enum drift.** Adding `register` changes the tool schema and may move
  the measured footprint; the full regeneration sequence (step 22), including
  the `DECISIONS.md:9` budget refresh, is not optional.
- **T461 identity.** T461 is confirmed at `test-output-contracts.ts:213`; if the
  probe finds the boundary-directive assertion split across tests, Phase 1 step
  6 names the extension point and the blast radius is amended.
- **`check:fast` red mid-increment** from `check-loop-artifacts` until the AAR
  lands (step 24).
- **Rollback:** `git revert` the single commit; no persisted state, no
  migration, no published artifact.

## Open questions

1. D6 is the one judgement call the user should confirm: the mechanical pause is
   implemented as a briefing directive over the existing `manage_scene (action:
   choices)` → `respond_decision` surface, not as a dispatcher refusal. If a
   hard refusal is wanted instead, it must come with a decision about the
   default level (today `mechanical_prompt`), because enforcing it changes
   default play and the harness corpus.
