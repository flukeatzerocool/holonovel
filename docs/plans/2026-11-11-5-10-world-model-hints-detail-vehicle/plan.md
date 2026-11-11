# Plan — §5.10 world-model hints, detail signal, vehicle traversal

Status: revised after cold review (2 Blockers, 6 Majors, 5 Minors folded in) ·
Kind: planned · Depth: standard · Independence: fresh
Increment target: `docs/plans/2026-11-11-5-10-world-model-hints-detail-vehicle/`
Rollback cost: 1 (reversible source and spec edits; one spec increment, one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the **first bullet** of the first open `ROADMAP.md` section — **§5.10
world-model contract remediation (P1)** — and close the three findings it owns:

- **F-P6a-8 — implicit action hints (REQ-284a–e).** Locked/open failures return
  `[WARNING]` with a separate `Corrective action: Hint: …` line instead of
  `[RULE_VIOLATION] The <object> is locked.` with the hint appended as a separate
  line; the readable-inside-a-closed-container hint and the adjacent-room
  vehicle/climbable hint are absent; the key-hint reachability rule admits
  closed containers, which REQ-284a excludes.
- **F-P6a-9 — detail signal and Player-Detail line (REQ-197c, REQ-197d).**
  `manage_character (action: signal)` rejects `signal: "detail"`, there is no
  `rich` level, `terse` does not override the room description mode or combat
  verbosity, and `badge_briefing` renders no Player-Detail line.
- **F-P6a-10 — vehicle traversal (REQ-317a–d).** Aboard a vehicle, movement
  ignores the parked room's door state and moves only the active entity;
  `create_thing (kind: "vehicle")` never sets `capacity`, so the parser's
  existing full-check is unreachable for CRUD-created vehicles; the interior is
  not a derived room with an `out` exit; the `[vehicle-entry]` moment omits the
  interior description; vehicle entries are not surfaced as recap scene
  transitions or in the briefing narrative context.

The roadmap bullet is one unit: hints, detail, vehicle. Bullet two (F-P6a-12,
F-P6a-13, F-P6a-14 — resources, suggest mapping, CRUD lifecycle) stays
scheduled and is **not** touched.

**Done bar** (each item names its command or artifact; no conditional clause)

1. F-P6a-8, F-P6a-9, and F-P6a-10 appear under
   `## Resolved — 2026-11-11 §5.10 hints, detail, vehicles` in
   `spec/audit/review-register.md`, each with a post-change `file:line`
   predicate that resolves on the committed tree and every covered REQ named.
2. The `## §5.10 world-model contract remediation (P1)` section in `ROADMAP.md`
   keeps only its resources/CRUD bullet plus a `**Trigger:**` line that closes
   on F-P6a-12, F-P6a-13, and F-P6a-14; `npm run check-roadmap` passes.
3. Widened assertions in `holonovel/scripts/test-output-contracts.ts` (T354,
   T240) and `holonovel/scripts/test-backfill.ts` (T362) fail on the pre-fix
   tree (output recorded in `aar.md`) and pass after the fix; these exit 0:
   `npm --prefix holonovel run test:backfill`, `test:output-contracts`,
   `test:world-remediation`, `test:adventure`, `test:narrative`.
4. T354 asserts the `[ERROR] [RULE_VIOLATION]` class on a locked `open`, the
   literal `Hint: You need the <object> (<location>) first.` line, the
   closed-jar readable hint, the adjacent-room vehicle hint, and the two
   no-hint cases (switched-off lantern, container in an adjacent room).
5. T362 asserts a CRUD-created vehicle's `capacity: 4`, the parser's
   `[RULE_VIOLATION] is full.` rejection, passenger movement with the
   parked-room door blocking, the interior `out` exit, absence of the interior
   from `world://map`, the `[vehicle-entry]` interior description, and the
   recap/briefing surfacing.
6. T240 asserts `signal: "detail"` with `terse`/`normal`/`rich`, the terse
   override of the room mode, the brief-then-rich full-description branch, the
   `spec_health.detail_level` field, and the `**Player-Detail:**` briefing line.
7. Appendix F T240 and T362 are widened to the contracts above; T354 is verified
   unchanged; `npm run validate --sdd-strict` reports 0 errors.
8. `npm run assemble` and `npm run check:fast` exit 0 un-piped with the trailing
   `check:fast: PASS` line; `npm run check` reports 0 errors; `npm run
   build-order` completes.
9. `aar.md` ends `LOOP PAUSED`; the increment lands as one commit via `npm run
   session:close`.

## 2. Verified baseline

- `npm run status` (this session): 46 unpushed commits, 15 open roadmap items,
  version `2026.11.10`, last publish `2026-11-09T04:30:29.593Z` (`repo`).
- `npm run check:fast` (this session): **40 passed, 0 failed**, trailing
  `check:fast: PASS` (`repo`). Baseline is green; no pre-fix commit needed.
- The register rows were written 2026-11-09; the tree has moved since. Every
  predicate below was re-checked on the current tree this session; clauses that
  already hold are listed separately so the plan closes them with evidence
  rather than re-fixing them (`repo`).
- `docs/plans/` is tracked and `check-loop-artifacts` reads every directory
  there (`scripts/lib/loop-artifacts.ts:29-88`), so the drafted plan lands in
  the gitignored `plans/` scratch tree and moves to `docs/plans/` together with
  `tasks.md` and `aar.md` at execution time.
- §5.10, §5.3 (REQ-197), and Appendix F are outside `DATA_SECTIONS` and
  `PACKAGE_SECTIONS` (`scripts/lib/contract-fingerprint.ts:27-43`), so no
  fingerprint regeneration is expected.

## 3. Evidence (re-derived this session)

**Still open (defects):**

| # | Predicate | Current code |
|---|---|---|
| A | A locked `open` returns `[WARNING]` with `Corrective action: Hint: …`; REQ-284b requires the rule-violation class with the hint appended as its own line | `holonovel/src/world/parser.ts:521-527`; renderer `holonovel/src/index.ts:5230-5239` |
| B | `read` on a thing inside a closed container falls through to `ctx.world.things.get(...)` and returns `[OK]` instead of the REQ-284c/e hint | `parser.ts:711-718` |
| C | `enter`/`climb` on a vehicle or climbable in an adjacent room return `[NOT_FOUND]`; no direction-bearing hint exists | `parser.ts:730-736`, `:748-760` |
| D | `findUnlockHint` treats a key in a closed container as reachable; REQ-284a allows only the current room, inventory, or an **open** container | `parser.ts:545-556` |
| E | The `signal` enum has no `detail` value and the handler stores any signal/value pair unvalidated | `index.ts:4137`, `:4337-4360` |
| F | Session detail is a two-value `normal`/`terse` switch with no `rich`, and it does not touch `roomDescriptionMode` or combat output | `index.ts:1936-1960`, `:4897-4899`; parser mode at `:5013` |
| G | `badge_briefing` renders no Player-Detail line | prompt body `index.ts:14661-14760` |
| H | **Withdrawn — predicate false.** `handleEnter` already rejects a full vehicle when `capacity` is defined | `parser.ts:753-755` (capacity enforcement already present) |
| I | Aboard movement resolves the parked room's exits but never consults `doorRefs`, and updates only the active entity's `current_room` | `index.ts:4994-5003` |
| J | `[vehicle-entry]` records only `entered <vehicle>`, never the interior description | `index.ts:5285-5295` |
| K | Vehicle moments reach `recap` only through the GM-only `story_entries` dump; `badge_briefing` has no vehicle narrative context | `index.ts:10263-10264` |
| L | `create_thing (kind: "vehicle")` sets no `capacity`, so a CRUD-created vehicle has no limit and H's check never fires; only `convert` defaults it to 4 | `index.ts:5589-5608`; `world/model.ts:851`, `:870` |

**Re-audited as holding (close with evidence, no edit):**

- Vehicle look/exit returns the interior text and returns the player to the
  parked room (REQ-317a/b, partially) — `index.ts:4965-4993`.
- A vehicle persists at its last location when unoccupied: `location` lives on
  the `WorldThing` and is persisted by `state.ts:923-974` (REQ-317b).
- The interior is already virtual — it is never inserted into `world.rooms`, so
  `world://map` cannot list it independently (REQ-317c) — `index.ts:4965-5003`.
- `command("brief"|"verbose"|"normal")` are recognized and session-scoped
  (REQ-197a/b) — `index.ts:4897-4899`.
- `spec_health.description_mode` and `verbosity_mode` are reported
  (REQ-197c/253, partially) — `index.ts:12846`, `:12863`.
- Light-triggered story events already emit `lore_trigger` to the event stream —
  `index.ts:7320-7345`.

**Carrying assertions.** T354 (`holonovel/scripts/test-output-contracts.ts:1536`)
asserts only that a reachable key hint contains `"Hint: You need the iron key"`,
so it passes today through `correctiveAction` — the behaviour already matches
Appendix F's T354 text, so the harness is the catch-up, not the appendix. T362
(`holonovel/scripts/test-backfill.ts:745`) asserts enter/look/exit only; T240
(`test-output-contracts.ts:1438`) asserts description modes and T313
(`:1211`) asserts `verbosity_mode` only. T553 (`test-output-contracts.ts:1552`)
already pins REQ-284f exactly: an unbound lockable unlocks freely (`[OK]`), a
**bound** key that is not carried returns `[WARNING]`, and the bound key becomes
a reachable hint once it is in the room (`:1560-1566`). D2 must preserve that
shape, including the free-unlock `[OK]`.

**Contract conflict (one).** REQ-284b's second example says
`command("unlock chest")` with no key in the world model returns
`[RULE_VIOLATION] The chest is locked.`, while REQ-284f says a lockable thing
with no bound key remains freely unlockable and lockable
(`spec/02-requirements.md:3271`, `:3283`). Appendix F T553 exercises the
REQ-284f reading. Resolved in-plan by D2, not deferred.

**Generated-surface coupling.** None of the edited code feeds
`generate-world-provider.ts`, `generate-tool-definitions.ts`, or
`generate-starter-novel.ts`: the `run_command` schema, `PARSER_CATALOG`, and
`manage_character` descriptions are unchanged unless D3 requires a signal
enumeration description edit, in which case Phase 5 regenerates tool
definitions. `manage_world`'s `create_thing`/`update_thing` descriptions change
if D5 adds `capacity`, which does trigger that regeneration.

## 4. Decisions

**D1 — One hint formatter, one reachability rule.** Add
`hintLine(object, location)` and `isHintReachable(thing, ctx)` to
`holonovel/src/world/parser.ts`. Reachability is exactly REQ-284a: the thing is
in the current room, in the player's inventory, or in an **open** container in
either. `findUnlockHint` switches to it (fixing D). The location is the room's
display name (`room.name`) or the literal `inventory` — never the lowercased
map key, so the assertion and the output agree on `(Hall)`. Hints are appended
to `text`, never to `correctiveAction`, so the response reads
`[ERROR] [RULE_VIOLATION] The chest is locked.\nHint: You need the iron key
(inventory) first.` The `[ERROR] [RULE_VIOLATION]` class is the existing
Appendix O.2 envelope (T176 renders it the same way); no renderer change.
**Adjacent-room exception.** REQ-284c's direction-bearing hint is *not* a
reachability case: it is a separate adjacency scan over the current room's
exits whose door is absent or open, naming a matching vehicle or climbable in
the destination room. Its pinned wording is
`Hint: The <object> is in <room> (<direction>) — go <direction> first.` The
REQ-284a reachability rule governs the key and container hints only.
Rejected: keep `correctiveAction` — REQ-284b says "appended … as a separate
line", and `Corrective action:` is a different line contract.

**D2 — Locked `open` is a rule violation; key-less `unlock`/`lock` stays a
warning.** `handleOpen` on a locked thing returns `ERROR` +
`RULE_VIOLATION`, with D1's hint when a reachable key exists and no hint
otherwise. `handleUnlock`/`handleLock` keep `[WARNING]` **only for a bound key
that is not carried**; a lockable thing with no bound key still unlocks and
locks freely with `[OK]`, exactly as T553 and REQ-284f require. To remove the
REQ-284b/REQ-284f conflict, amend REQ-284b's second example from
`command("unlock chest")` to `command("open chest")` on a chest whose key is
absent from the world model — the sentence keeps its no-hint contract and the
body stays far under 800 characters. Rejected: implement REQ-284b's example
literally — it would break the free-unlock `[OK]` in T553 and contradict
REQ-284f.

**D3 — `detail` is the session detail level.** Add `detail` to the
`manage_character` signal enum with values `terse | normal | rich`, validated at
the handler (unknown value → `[INVALID_INPUT]` naming the three). Replace the
two-value `outputVerbosity` with `detailLevel: "terse" | "normal" | "rich"`:

- `terse` — `terseMode()` returns true, room output is name-and-exits only
  (forced `brief`), combat feedback is participant + result, no lore notices;
- `normal` — the player's chosen room mode (default `normal`), balanced output,
  existing roll transparency, no lore notices;
- `rich` — **full** room descriptions forced to `verbose` regardless of the
  player's chosen mode, complete roll transparency, and a lore notice line.

The player's chosen room mode is stored separately as
`chosenRoomDescriptionMode`, updated whenever `brief`/`verbose`/`normal` runs
(and defaulting to `normal`). Detail level is an evaluation-time override, not
a mutation: `terse` renders `brief`, `rich` renders `verbose`, `normal` renders
the chosen mode. Leaving `rich` or `terse` therefore falls back to whatever the
player actually chose, including a choice made while a level was in force, and
a player who never touched `terse` still gets their choice back after `rich`.
`spec_health.description_mode` reports the effective mode (the same value the
parser receives), and `spec_health.detail_level` reports the level. `rich`
appends a one-line `[lore] <key>` notice to `run_command` output by
snapshotting the active-lore key set (`loreActiveForSection` + presence,
`index.ts:886-932`) before dispatch and diffing it after; the notice means
"newly active" lore, the set is per-call with no persistent buffer, and no
other tool gains the notice. Rejected: keep `outputVerbosity` and add a
parallel `rich` flag — two switches would need a precedence rule and would let
`verbosity: terse` and `detail: rich` disagree. Rejected: implement `rich` as
"restore the chosen mode" — that makes it indistinguishable from `normal` when
the player chose `brief` and fails REQ-197c's "full descriptions".

`manage_diagnostics (action: verbosity, mode)` maps `terse`/`normal` onto
`detailLevel` and keeps reporting `verbosity_mode`; `spec_health` also reports
`detail_level`. The `verbosity` action appears on two schemas —
`manage_diagnostics` (`index.ts:10052-10053`, `mode` pinned to
`normal|terse`) and a second action enum at `index.ts:10083`; Phase 3 confirms
which handler is live and updates both enumerations and descriptions so the
two-valued preference never silently overrides a rich level. Rejected: widen
`verbosity` to three values — REQ-253 keeps that action two-valued, and the
three-value surface belongs to REQ-197c's signal.

**D4 — Player-Detail line.** `badge_briefing` renders
`**Player-Detail:** <level>` after the badge-foundations block, in the
never-truncated tier (REQ-135) beside the orientation text composed by
`composeBadgeOrientation` (`src/core/prompt-composition.ts`); Phase 3 confirms
the line survives the `prompt_inputs` fallback and the tier split. It renders
for every badge (the level is session state, not a secret), satisfying
REQ-197d's "visible in badge_briefing as a Player-Detail line". Rejected:
render only for the Player badge — the GM needs to know the table's detail
level when narrating.

**D5 — Vehicle capacity lives in the parser.** `create_thing (kind:
"vehicle")` sets `capacity` from a shared `DEFAULT_VEHICLE_CAPACITY` (4, the
`convert` default, `world/model.ts:851`) or from an optional integer `capacity`
argument on `create_thing`/`update_thing`. The existing parser check
(`parser.ts:753-755`) remains the single enforcement point: it runs before any
`in_vehicle` side effect, so no duplicate check is added to `index.ts`. Entry is
idempotent per passenger (an already-listed id is not pushed again), so a
re-enter cannot consume capacity twice. Adding the argument changes the
`manage_world` description and regenerates tool definitions (Phase 5).
Rejected: enforce in both the parser and the `index.ts` enter branch — two
owners with two defaults is exactly the drift predicate H exposed. Rejected:
require the caller to pass `capacity` — CRUD-created vehicles would stay
unlimited and REQ-317c's rejection would remain unreachable.

**D6 — Aboard movement reuses exit and door semantics.** Before moving, resolve
the parked room's `doorRefs` for the direction and return the same
`[WARNING] The <door> is closed[ and locked].` the parser's `handleGo` emits
(`parser.ts:386-400`) instead of moving. On a successful move, set
`current_room` for every passenger in `vehiclePassengers` that resolves in
`novel.entities` or `novel.npcs`, keep the vehicle's `location` as the single
source of truth, and leave the interior virtual (D7). Items whose `location`
is the vehicle move implicitly and need no rewrite. Rejected: route the aboard
case through `handleGo` — the parser resolves against `ctx.currentRoom`, which
stays the parked room only by convention while `in_vehicle` is set, and the
special case also owns `look`/`exit`; sharing the door helper is the smaller
change.

**D7 — Interior stays a virtual room.** Do not insert an interior `WorldRoom`.
The current special case is the contract: while `in_vehicle` is set, `look`
renders the interior description and `Exits: out.`, and `exit`/`get out`
returns the entity to `vehicle.location`. This satisfies REQ-317a/b's
observable behaviour and REQ-317c's "SHALL NOT appear in `world://map`
independently" by construction. Rejected: materialize the interior in
`world.rooms` — it would leak into every room enumeration (`world://map`,
briefing, room lists) and require a filtering pass across surfaces for no
contract benefit.

**D8 — Vehicle narrative surfacing.** `recordVehicleMoment` takes the interior
description and writes `[vehicle-entry] entered <vehicle> — <interior>`;
`manage_context (action: recap)` derives `scene_transitions` entries for
vehicle moments (type `vehicle` with the entry text) for GM and Player badges
alike; `badge_briefing` gains a `### Vehicle` block when the active entity is
aboard or the last five story entries contain a vehicle moment, naming the
vehicle, the parked room, and the interior line. The block renders in the
never-truncated tier so the `prompt_inputs` fallback cannot drop it. The GM's
`manage_scene` remains authoritative — no scene state is written. Rejected:
rely on the existing GM-only `story_entries` dump — REQ-317d names both the
Player-visible recap and the briefing, and the dump is badge-gated away from
players.

**D9 — Scope stop.** F-P6a-12, F-P6a-13, and F-P6a-14 (resources, suggest
mapping, CRUD lifecycle) are out of scope. A defect discovered in that surface
becomes a register row, not an in-plan expansion. Rejected: fold the CRUD
bullet in — it doubles the changed surface and makes the increment's done bar
unreachable in one session.

## 5. Phases

### Phase 0 — Baseline and predicate re-check (S)

1. Run `npm run status` and `npm run check:fast` un-piped; record both.
2. Re-confirm predicates A–L (§3) with `grep -n`; a clause that already holds is
   dropped from the fix list and recorded as evidence in `aar.md`.
3. Run the baseline harnesses this plan depends on — `test:backfill`,
   `test:output-contracts`, `test:world-remediation`, `test:adventure`,
   `test:narrative` — and record exit status. A red baseline is a P0 fixed
   first, as its own commit. Reconcile Phase 1 against the Appendix F rows T354
   and T362 before rewriting them: T354 already states the locked-open
   violation, the hint format, the jar hint, the adjacent-room vehicle hint, and
   both no-hint cases, so the harness is catching up to existing text; T362
   already states the journal/recap/briefing surfacing but not capacity or
   door-blocked movement. Record which clause each Phase 1 assertion adds.
4. Confirm `docs/plans/2026-11-11-5-10-world-model-hints-detail-vehicle/` does
   not already exist, and draft this plan in the gitignored `plans/` tree until
   the increment directory is created with all three artifacts.
5. **Sibling-contract grep.** Search the REQ corpus for `hint`, `Hint:`,
   `detail`, `Player-Detail`, `vehicle`, `capacity`, `in_vehicle`, and the REQ
   IDs REQ-197c/d, REQ-284a–f, REQ-317a–d. Confirm no second contract fixes the
   same output; a newly found conflict stops the run for a decision.
6. **Register cross-reference.** Grep the whole of
   `spec/audit/review-register.md` for each covered REQ ID and for F-P6a-8/9/10;
   only those three rows may cite them.
7. Measure the pre-edit body of REQ-284b with `extractReqBodies` and record the
   count (D2's amendment must stay under 800 characters / 8 sentences).

### Phase 1 — Red tests (M)

1. `test-output-contracts.ts`, widen T354 (`:1536`): locked `open` returns
   `[ERROR] [RULE_VIOLATION]` with the exact
   `Hint: You need the iron key (Hall) first.` line; no key → no `Hint:` line;
   `read` on an inscription inside a closed glass jar returns
   `Hint: The inscription is inside the glass jar — open it first.`; `enter
   raft` with the raft one room north through an open exit returns
   `Hint: The raft is in the Shore (north) — go north first.`; `enter
   nonexistent` still returns `[NOT_FOUND]` and `enter rock` still returns
   `[RULE_VIOLATION]` (the hint is additive, never a prefix replacement); a
   switched-off lantern produces no hint; a container in an adjacent room
   produces no hint.
2. `test-output-contracts.ts`, extend T240 (`:1438`): `signal detail=terse`
   returns `[OK]`, forces `look` to name-and-exits only, reports
   `spec_health.detail_level = "terse"`, and renders `**Player-Detail:** terse`
   in `badge_briefing`; **`detail=rich` after a `brief` command returns the
   full room description** (not name-and-exits) and appends a `[lore]` notice
   when a lore entry becomes newly active; `rich` → `normal` restores `brief`
   without a prior `terse`; `rich` → `terse` → `normal` restores `brief` rather
   than the forced `verbose`; `detail=normal` after `detail=terse` restores a
   previously set `verbose`; an invalid value returns `[INVALID_INPUT]` naming
   the three values.
3. `test-backfill.ts`, widen T362 (`:745`): a CRUD-created vehicle carries
   `capacity: 4` and rejects a fifth passenger with `[RULE_VIOLATION] is full.`;
   `enter` + `go north` moves a second entity passenger; a closed door on the
   parked room blocks movement with `[WARNING]`; `look` while aboard shows the
   interior and `Exits: out.`; `exit` returns to the parked room; `world://map`
   carries no interior node; the `[vehicle-entry]` moment carries the interior
   description; `recap` carries a vehicle `scene_transition`; `badge_briefing`
   carries the `### Vehicle` block.
4. All new assertions must fail on the current tree; the exact failure output
   goes into `aar.md`.

### Phase 2 — Parser hints (M)

`holonovel/src/world/parser.ts`:

- `hintLine` + `isHintReachable` (D1); `findUnlockHint` rebuilt on them.
- `handleOpen`: `ERROR`/`RULE_VIOLATION`, hint appended to `text` (D2).
- `handleUnlock`/`handleLock`: keep `[WARNING]` for a bound, uncarried key and
  `[OK]` for the free-unlock case; the hint moves into `text` so the line
  contract is uniform (REQ-284f still satisfied — T553 must pass unchanged).
- `handleRead`: resolve only reachable things; a readable thing inside a closed
  container in the room returns `ERROR`/`RULE_VIOLATION` plus the REQ-284c/e
  hint (B).
- `handleEnter`/`handleClimb`: keep the existing `[NOT_FOUND]` (no match) and
  `[RULE_VIOLATION]` (matched but not enterable/climbable) results; when the
  requested name is absent from the room and a vehicle/climbable of that name
  sits in an adjacent room through an open exit, append the D1 adjacency hint
  (C). No hint for containers, per T354.

### Phase 3 — Detail level and briefing (M)

`holonovel/src/index.ts`:

- Replace `outputVerbosity` with `detailLevel` (D3); `terseMode` derives from
  it; keep `verbosity_mode` in `spec_health` and add `detail_level`.
- `manage_character` signal enum gains `detail`; handler validates
  `terse|normal|rich`, sets `detailLevel`, and derives the effective room mode
  from `chosenRoomDescriptionMode` (D3); `rich` renders verbose, `terse` brief.
- `manage_diagnostics (action: verbosity)` maps onto `detailLevel`; confirm
  which of the two `verbosity` action enums (`:10052-10053`, `:10083`) is live
  and update both enumerations and descriptions.
- `run_command`: append `[lore]` notices when `detailLevel === "rich"` by
  diffing the active-lore key set before and after dispatch (D3).
- `badge_briefing`: `**Player-Detail:** <level>` in the never-truncated tier
  after the composed badge foundations (D4); `### Vehicle` narrative block in
  the same tier (D8).

### Phase 4 — Vehicles (M)

`holonovel/src/index.ts`:

- `create_thing`/`update_thing`: vehicle `capacity` default 4 plus optional
  argument (D5). No capacity check is added to the `enter` branch — the parser
  owns it.
- Aboard movement: door check before movement, passenger `current_room`
  updates, parked-room hazards retained (D6).
- `recordVehicleMoment`: interior description in the entry (D8).
- `recap`: vehicle `scene_transitions` for every badge (D8).

### Phase 5 — Spec and bookkeeping (M)

1. Apply D2's REQ-284b example amendment; re-measure the body; walk the
   Appendix M checklist.
2. `spec/appendices-reference.md`: widen **T240** with the detail-signal
   assertions, and widen **T362** with the capacity, door-blocked movement, and
   interior-map-exclusion clauses. **T354 is verified, not rewritten** — its
   text already carries the Phase 1 assertions; if any literal differs, correct
   the harness, not the appendix.
3. `npm run validate --sdd-strict`; any shape error stops the run.
4. `spec/audit/review-register.md`: move F-P6a-8, F-P6a-9, and F-P6a-10 to the
   Resolved section with post-change predicates; leave F-P6a-12/13/14
   scheduled.
5. `ROADMAP.md`: delete the first bullet; rewrite the trigger to close on
   F-P6a-12/13/14; `npm run check-roadmap`.
6. `npm run validate -- --write-register`; `npm run check-registers`.
7. Regenerate tool definitions if D5 added a `manage_world` argument;
   `check-tool-definitions-sync`, `tool-definitions-lint`,
   `check-tdqs-scoreboard`, `surface-budget` (with `-- --write` only when the
   footprint moved).
8. New top `CHANGELOG.md` heading `## 2026-11-11 — §5.10 hints, detail, and
   vehicle remediation`, naming the REQ-284b example amendment.
9. `npm run build-order`.

### Phase 6 — Verify and close (S)

Run every command in §7, write `aar.md`, then `npm run session:close`.

## Files expected

- `holonovel/src/world/parser.ts`
- `holonovel/src/index.ts`
- `holonovel/scripts/test-backfill.ts`
- `holonovel/scripts/test-output-contracts.ts`
- `spec/02-requirements.md` (REQ-284b example only)
- `spec/appendices-reference.md` (T240, T362; T354 verified)
- `spec/audit/review-register.md`
- `spec/audit/req-coverage.md`
- `holonovel/tool-definitions.json`, `holonovel/tool-surface-registry.json`
  (only if D5's argument moves the surface)
- `spec/audit/tool-surface-baseline.json` (only if the budget moves)
- `holonovel.md`, `holonovel/holonovel.md` (assembled)
- `ROADMAP.md`, `CHANGELOG.md`
- `docs/plans/2026-11-11-5-10-world-model-hints-detail-vehicle/{plan,tasks,aar}.md`

## 6. Blast radius and rollback

| Surface | Change | Size |
|---|---|---|
| `parser.ts` | hint helper, reachability, open/read/enter/climb hints | M |
| `index.ts` | detail level, signal enum, briefing lines, vehicle capacity/movement/moments/recap | M |
| `test-output-contracts.ts` | T354 widened, T240 widened, T553 untouched | M |
| `test-backfill.ts` | T362 widened | S |
| `spec/02-requirements.md` | one REQ example (D2) | S |
| `spec/appendices-reference.md` | T240 and T362 widened; T354 verified | S |
| `spec/audit/review-register.md` | three findings moved to Resolved | S |
| `spec/audit/req-coverage.md` | regenerated by `validate -- --write-register` (Phase 5.6) | S |
| `ROADMAP.md`, `CHANGELOG.md` | bullet removed, dated heading added | S |
| `holonovel.md`, `holonovel/holonovel.md` | assembled from `spec/` | S |
| `docs/plans/2026-11-11-5-10-world-model-hints-detail-vehicle/{plan,tasks,aar}.md` | created at execution; gates `check-loop-artifacts` | S |
| `holonovel/tool-definitions.json`, `tool-surface-registry.json`, `tool-surface-baseline.json` | only if D5 changes the tool surface | — |
| `holonovel/src/generated/contract-fingerprints.ts` | not expected (§5.10 and Appendix F are outside both section lists; the fingerprinted sections are §5.6, §5.9, §5.19, §5.21–§5.28, §5.31–§5.32, §7.7, and Appendix Q) | — |

Rollback cost 1: every edit is a reversible source or spec edit; no Novel schema
change and no on-disk migration. `in_vehicle` is already persisted through the
entity record; no new persisted field is introduced.

## 7. Verification

| Step | Command | Expectation |
|---|---|---|
| Red tests | the three harnesses, pre-fix | each new assertion fails (recorded) |
| Targeted harnesses | `npm --prefix holonovel run test:backfill`, `test:output-contracts`, `test:world-remediation`, `test:adventure`, `test:narrative` | exit 0 |
| REQ shape | `npm run validate --sdd-strict` | 0 errors; REQ-284b under 800 chars / 8 sentences |
| Assembled spec | `npm run assemble` | exit 0 |
| Fast gates | `npm run check:fast` (un-piped) | exit 0, `check:fast: PASS` |
| Full gates | `npm run check` | 0 errors |
| Registers | `check-registers`, `check-roadmap`, `check-traceability`, `check-loop-artifacts` | PASS |
| Tool surface | `check-tool-definitions-sync`, `tool-definitions-lint`, `check-tdqs-scoreboard`, `surface-budget` | PASS |
| Full pipeline | `npm run build-order` | completes |
| Close | `npm run session:close` | one commit |

## 8. Risks, edge cases, assumption audits

- **Hint text stability.** T354 pins the literal `Hint: You need the <object>
  (<location>) first.` line and the jar sentence; D1 pins the adjacent-room
  wording in the design, not at test-authoring time, so the assertion and the
  code cannot drift.
- **Prefix regression on `enter`/`climb`.** The existing `[NOT_FOUND]` and
  `[RULE_VIOLATION]` results survive when no adjacent match exists; T362
  asserts both, so a hint implementation cannot silently reclassify them.
- **Warning-versus-violation regression.** T553 (REQ-284f) must keep passing
  after D2, including its free-unlock `[OK]` for an unbound lockable; Phase 1
  leaves T553 untouched and Phase 6 runs it.
- **Detail state leakage.** `detailLevel` is a module-level session variable
  like `roomDescriptionMode`; a Novel switch does not reset it, matching
  REQ-197d's "session-scoped, discarded on connection close". The chosen mode
  is stored independently of the level, so `rich`/`terse` cannot overwrite it
  and every exit path falls back to the player's last explicit command.
- **Briefing tier.** The Player-Detail and `### Vehicle` lines are inserted in
  the never-truncated tier after `composeBadgeOrientation`; Phase 3 confirms
  they survive the `prompt_inputs` fallback and the tier split (REQ-135).
- **Rich-mode cost.** `rich` adds only a notice line and defers to existing
  full-output paths; it must not change token budgets. The `[lore]` set is a
  per-call before/after diff, so no state accumulates across commands.
- **Vehicle interior leak.** D7 keeps the interior out of `world.rooms`; Phase 1
  asserts `world://map` carries no interior node. Any future materialization
  must add a filtering pass and is out of scope.
- **Passenger resolution.** `vehiclePassengers` may hold stale ids; D6 skips
  ids that resolve to neither entity nor NPC and does not throw.
- **Capacity default drift.** `convert` already defaults to 4
  (`world/model.ts:851`); `create_thing` uses the same constant so the two paths
  cannot disagree (a shared `DEFAULT_VEHICLE_CAPACITY`).
- **Tool-surface movement.** D5's optional `capacity` argument edits the
  `manage_world` description; `surface-budget --write` runs only if the budget
  gate reports a move, and the scoreboard is regenerated in the same phase.
- **Fingerprint expectation.** A `check-fingerprint-sync` failure means an
  out-of-scope §7.7/§5.6/§5.9/Appendix Q section was edited — stop and
  investigate rather than regenerating.
- **No new gate.** No check is installed; the reused gates are listed in §7.

## 9. User impact

Four caller-visible changes, all required by the named REQs:

1. A locked `open` now reports `[ERROR] [RULE_VIOLATION]` with the hint on its
   own line; `unlock`/`lock` keep the `[WARNING]` contract (REQ-284b/f).
2. New hints: readable-in-a-closed-container and the adjacent-room
   vehicle/climbable direction hint (REQ-284c/e).
3. `manage_character (action: signal, signal: "detail", value: terse|normal|
   rich)` becomes the session detail control: terse forces brief room output,
   rich forces full descriptions, complete roll transparency, and `[lore]`
   notices, and `badge_briefing` gains a `**Player-Detail:**` line
   (REQ-197c/d).
4. Vehicles created through CRUD get the default capacity of 4 (enforced by the
   existing parser check), carry their passengers through doors, and surface
   their traversal in the recap and briefing (REQ-317a–d).

No tool is renamed, no existing parameter changes meaning, and no persisted
shape changes: `detailLevel` is session state and capacity defaults to the value
`convert` already writes, so a Novel saved before this increment loads
unchanged.

## 10. Open questions

None. The roadmap bullet fixes the scope (hints, detail, vehicles); bullet two
stays scheduled. The one REQ conflict is resolved in-plan by D2.
