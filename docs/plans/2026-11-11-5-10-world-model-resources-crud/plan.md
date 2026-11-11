# Plan — §5.10 world-model resources, suggest mapping, CRUD lifecycle

Status: revised after cold review (Stages 1–4; Stage 5 re-audit NO-GO resolved post-cap) ·
Kind: planned · Depth: standard · Independence: self (cold pass did not return passed.)
Conditions: C-indep `risk accepted: no cold pass — authorized by user (session reply
option 1)` — the Stage-5 readiness NO-GO was resolved after the one-re-audit cap
without a third pass; build-review confirms the four fixed items (door fixture
call, `audit://novel` read, `convert` fixture text, archive injection path) at
execution.
Increment target: `docs/plans/2026-11-11-5-10-world-model-resources-crud/`
Rollback cost: 1 (reversible source and spec edits; one spec increment, one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the **last open bullet** of the `ROADMAP.md` section **§5.10 world-model
contract remediation (P1)** — resources, suggest mapping, and CRUD lifecycle —
and close the three findings it owns. The prior session closed F-P6a-8/9/10 and
left only this bullet, whose trigger closes on F-P6a-12, F-P6a-13, and F-P6a-14
(`ROADMAP.md:15-25`).

- **F-P6a-12 — world resources and badge filtering (REQ-202a, REQ-202b,
  REQ-222b, REQ-325a, REQ-309b).** `room://` renders only name, description, and
  exits — no visible things and no hazard annotations; `thing://` omits most
  properties and the containment chain; `world://map` and `world://kinds` are
  served without a badge read, so the Player badge receives the GM metadata and
  the full parser verb catalog; the `constraints://active` Player filter
  compares a mechanic name to an entity name.
- **F-P6a-13 — Player spatial suggest never maps to resolve (REQ-309b,
  REQ-309g).** Under the Player badge on a ruleset-bound Novel,
  `run_command (action: suggest)` returns prose ("declare intent … the narrator
  resolves it through the parser") instead of naming
  `run_command (action: resolve)`.
- **F-P6a-14 — CRUD lifecycle gaps (REQ-198, REQ-199).** `create_exit` writes no
  `doorRefs`, so a door created through CRUD never blocks passage;
  `update_room` is not audit-logged; `remove_room` leaves nested container
  contents, stale door references, and their door things behind; `remove_exit`
  leaves the reverse exit and both door references behind.

F-P6a-7 and F-P6a-11 were resolved in the 2026-11-10 sessions
(`spec/audit/review-register.md:54`, `:73`), so 12/13/14 are the complete open
set for this section.

One contract defect and one wrong citation surfaced while auditing F-P6a-12's
`constraints://active` clause and are **scheduled, not fixed here** (D9):
REQ-325b/c require a blocked world-model error to carry an override hint, while
`run_command (action: resolve)` currently bypasses the block and returns
`override_hints` on a `resolved` result (`holonovel/src/index.ts:6069-6090`),
and REQ-325c cites T369 (vow-countdown) rather than the T372 row that names the
hint contract. Both become one `F-5.10-1` review-register row and a new ROADMAP
section, so this plan does not repoint a Check to a clause it defers.

**Done bar** (each item names its command or artifact; no conditional clause)

1. F-P6a-12, F-P6a-13, and F-P6a-14 appear under a new
   `### 2026-11-11 §5.10 resources, suggest, and CRUD` subsection of
   `## Resolved` in `spec/audit/review-register.md`, each with a post-change
   `file:line` predicate that resolves on the committed tree and every covered
   REQ named.
2. `ROADMAP.md` retires the §5.10 resources/CRUD section (its trigger closes
   and the section has no remaining bullets), a new
   `## §5.10 constraint override hint envelope and REQ-325c Check (P1)` section
   carries the scheduled F-5.10-1 row with a trigger that closes when F-5.10-1
   is `Resolved`, and `npm run check-roadmap` passes.
3. The **new positive** assertions — T245 (visible things), T242 (CRUD door
   block), T245 (`**Annotations:**`, `**Properties:**`, containment chain, GM
   map annotations, bound-Player kinds omission), T372
   (`by_type`/`by_source`, Player attribution), and the suggest mapping — fail
   on the pre-fix tree (output in `aar.md`) and pass after the fix. The
   **omission** assertions (Player `room://`/`thing://` carry no ids, property
   values, or annotations; Player map carries no `## Annotations`) are green
   pre-fix by construction and are recorded as regression guards, not red proof.
   These exit 0: `npm --prefix holonovel run test:backfill`,
   `test:output-contracts`, `test:world-provider`, `test:world-remediation`.
   The last is a regression harness only — the plan does not modify it.
4. T241 explicitly calls `create_room` and `update_room` (so their audit entries
   exist), then asserts the reverse exit, a fixed thing's take violation,
   `list` rooms carrying their `exits` and `get <room>` returning the exits map,
   a Player `[FORBIDDEN]`, `remove_room` removing a **two-level** chain (thing
   inside a container inside the room) and both-direction exits, `remove_exit`
   removing the reverse exit, `create_exit` with a bound `door` followed by
   `undo` leaving no `doorRefs`/`doorConnects`, the audit entries for
   `create_room`, `create_thing`, `create_exit`, `update_room`, `remove_room`,
   and `remove_exit`, and undo restoring the room with its contents.
5. T242 asserts a CRUD-bound closed door blocks passage in both directions,
   `unlock` with the bound carried key succeeds, `undo` restores the locked
   state, and `open` then `go` passes.
6. T245 seeds a fresh Novel through `convert` with `@encounter`, a parameterized
   `@trap(… snuff=… faces=… resource=…)`, `@npc`, and `@lore`, plus an open
   container holding a thing and a closed container holding a thing, then
   asserts `room://` visible things (direct occupants, the open container's
   contents, not the closed container's) and GM annotations (all four keys),
   `thing://` properties and containment chain, Player exclusion of ids,
   property values, and annotations, GM map annotations, the bound-Player
   `world://kinds` omission of `Parser Commands` and `Verb Coverage Tiers`, and
   the unset-badge (`none`, the Editor badge) GM view.
7. T372 asserts GM sees every override, Player sees only the active entity's
   attributed override plus `match_all` (and only `match_all` when no entity is
   active), and `constraint_override_counts` reports `total` plus non-empty
   `by_type`/`by_source` maps keyed by the entry's `type` and `source` (the
   mechanic-source field).
8. The suggest case asserts the Player result on a ruleset-bound Novel names
   `run_command (action: resolve` and no parser `execute` form, while the GM
   result names both and a ruleset-free Player keeps the `execute` form
   (REQ-309b's ban is scoped to ruleset-bound Novels).
9. Appendix F T241, T242, T245, and T372 are widened to the contracts above;
   `npm run validate --sdd-strict` reports 0 errors.
10. `npm run assemble` and `npm run check:fast` exit 0 un-piped with the trailing
    `check:fast: PASS` line; `npm run check` reports 0 errors; `npm run
    build-order` completes.
11. `aar.md` ends `LOOP PAUSED`; the increment lands as one commit via `npm run
    session:close`.

## 2. Verified baseline

- `npm run status` (this session): 47 unpushed commits, 15 open roadmap items,
  version `2026.11.11`, oldest unpushed 2.4d (`repo`).
- `npm run check:fast` (this session): **40 passed, 0 failed**, trailing
  `check:fast: PASS` (`repo`). Baseline is green; no pre-fix commit needed.
- The findings were written 2026-11-09; the tree has moved (line numbers in the
  register are stale by tens of lines). Every predicate below was re-checked on
  the current tree this session; clauses that already hold are listed separately
  so the plan closes them with evidence rather than re-fixing them (`repo`).
- `plans/*` is gitignored (`.gitignore:13-14`), so this draft lives in
  `plans/2026-11-11-5-10-world-model-resources-crud/` and moves to
  `docs/plans/` with `tasks.md` and `aar.md` at execution. Drafting directly in
  `docs/plans/` would turn `check-loop-artifacts` red before the AAR exists.
- §5.10 and Appendix F are outside `DATA_SECTIONS`/`PACKAGE_SECTIONS`
  (`scripts/lib/contract-fingerprint.ts:27-43`), matching the prior session's
  fingerprint expectation; no `contract-fingerprints.ts` regeneration is
  expected.

## 3. Evidence (re-derived this session)

**Still open (defects):**

| # | Predicate | Current code |
|---|---|---|
| A | `room://<id>` renders name, description, exits only — no visible things, no hazard `annotations` (REQ-202a) | `index.ts:13284-13303` |
| B | `thing://<id>` renders `location` and five booleans; no `fixed`, `capacity`, `transparent`, `readable`, `key`, `doorConnects`, or containment chain; the Player sees name/kind/description only (REQ-202a/b) | `index.ts:13305-13322` |
| C | `world://map` takes no badge; `worldMap(world)` emits name + exits only, so GM annotations cannot be surfaced and the Player/GM views are identical (REQ-202b) | `index.ts:13324-13328`; `world/model.ts:1044-1054` |
| D | `world://kinds` takes no badge; `worldKinds()` renders `## Parser Commands` and `## Verb Coverage Tiers` to every caller, so the Player badge on a ruleset-bound Novel sees parser verb names (REQ-309b, REQ-202b) | `index.ts:13330-13332`; `world/model.ts:1056-1092` (parser section `:1073-1083`) |
| E | The Player `constraints://active` filter is `o.name === entity?.name`, comparing a mechanic name (e.g. `Knock`) to an entity name (REQ-325a) | `index.ts:13537-13546` |
| F | `constraint_override_counts` is `Object.keys(overrides).length` — a single total, not counts by type and by source (REQ-325a) | `index.ts:12798` |
| G | Player spatial suggest on a ruleset-bound Novel returns `declare intent "<cmd>" — the narrator resolves it through the parser`, naming no `run_command (action: resolve)` (REQ-309b, REQ-309g) | `index.ts:4829-4831` |
| H | `create_exit` sets both rooms' `exits` but writes no `doorRefs` and no `doorConnects`; no argument lets a CRUD-created door bind to an exit, so REQ-199's door block is unreachable through CRUD | `index.ts:5713-5732`; door binding exists only in `convert` at `world/model.ts:645-651` (with `doorConnects` at `:679`) |
| I | `update_room` writes `room.description` without an `audit(...)` call (every other CRUD branch audits) | `index.ts:5604-5613` |
| J | `remove_room` deletes only things whose `locationType === "room"` (nested container/supporter/vehicle contents survive), deletes exits but leaves the destination's `doorRefs` and the bound door things (REQ-198) | `index.ts:5613-5633` |
| K | `remove_exit` deletes only the named room's direction — the destination's opposite exit survives as a one-way exit — and leaves `doorRefs` on both rooms and `doorConnects` on the door thing | `index.ts:5733-5746` (delete at `:5741`; `create_exit` writes both sides at `:5726-5727`) |

**Re-audited as holding (close with evidence, no edit):**

- `world://kinds` already carries `parser_commands` with each verb's category
  and extraction source (REQ-222b): `world/model.ts:1073-1083`, asserted by
  `holonovel/scripts/test-world-provider.ts:75-81`. The 2026-11-09 clause
  "exposes no `parser_commands` with source" is stale; only the badge leak (D)
  is live.
- `world://map` already renders the REQ-202b adjacency list (room name +
  directional exits) for every badge: `world/model.ts:1044-1054`.
- `create_thing (kind: "door")` already sets `openable`/`lockable` and
  `portable: false` (`index.ts:5654-5662`); only the binding is missing.
- `remove_thing` is audited (`index.ts:5702-5711`, audit at `:5710`);
  `create_room`, `create_thing`, and `remove_room` are audited.
- `run_command (action: suggest)` already separates spatial from mechanical and
  social domains (`index.ts:4833-4908`), so the Player change is confined to
  `spatialCmd`.
- REQ-325a's entry fields (type, name, source, prerequisites) are carried by the
  state entry type (`holonovel/src/core/state.ts:753`), including `match_all`
  and `slots_remaining`; the catalog payload only needs an attribution field and
  per-type/per-source counting. `source` here is the **mechanic source**
  (`spell`, `class_feature`, `item`, `ability`) named by REQ-325a, not the
  source anchor.

**Carrying assertions.**

- T241 (`test-backfill.ts:444`) asserts only `create_thing` → `list` → `get` →
  `remove_thing`, despite the Appendix F row naming reverse exits, the fixed
  take violation, Player forbidden, room removal, audit, and undo
  (`spec/appendices-reference.md:1699`).
- T242 (`test-backfill.ts:455`) asserts only that a duplicate `create_room`
  returns `[STATE_CONFLICT]`, none of the Appendix F door/container contract
  (`:1700`).
- T245 (`test-backfill.ts:501`) asserts only that the map contains a room and
  that kinds contains the property contract, `device`, `vehicle`, `openable`,
  and `switchable`; it reads neither `room://` nor `thing://` and never switches
  badge, despite `:1703`. Its fixture (`bf2-parser`) must be replaced with a
  fresh Novel seeded by `convert` carrying `@encounter`, a parameterized
  `@trap(… snuff=… faces=… resource=…)`, `@npc`, `@lore`, and open/closed
  containers, because CRUD cannot write `room.annotations` (`create_room`
  hardcodes `{}` at `index.ts:5598`; only `convert` materializes them) and
  `convert` refuses a populated world (`index.ts:5750-5752`).
- T372 (`test-output-contracts.ts:1575`) asserts only that the resource returns
  `[` and that `constraint_override_counts` exists, despite `:1827`.
- T96/T119/T120 (`test-backfill.ts:520`) asserts only that the Player suggest
  output contains `Spatial`.
- T369 (`test-output-contracts.ts:744`) is vow-countdown coupling, so it cannot
  evidence REQ-325c; the Check is wrong, not the harness.

**Per-type/per-source counting.** `spec_health.constraint_override_counts` at
`index.ts:12798` is a number. Appendix F T372 and REQ-325a demand counts by
constraint type and mechanic source; the plan replaces the number with an
object `{ total, by_type, by_source }` and updates the only consumer assertion.

## 4. Decisions

**D1 — Resources read the live badge once.** Every world-model resource handler
resolves `const gameMaster = getBadge() === "game_master" || getBadge() ===
"none"` (the same predicate the world-model tool surface uses at
`index.ts:4828`), replacing the mixed `novel.badge === "game_master"` checks in
`room://`/`thing://` and the missing check in `world://map`/`world://kinds`.
`getBadge()` is the single source that `set_badge` mutates, so a badge switch is
reflected on the next read. `none` is the Editor badge (`Badge` union at
`holonovel/src/core/state.ts:73`; `normalizeBadge` maps unknown values to it),
so Editor and unset sessions get the GM view; `observer` gets the Player view.
Rejected: keep `novel.badge` — the constraints resource and suggest mapping
already use `getBadge()`, and two readers for one question is the drift the
finding names.

**D2 — `room://` payload.** Player sees `## name`, the description, a
`**You can see:**` line listing things whose `location` is the room with
`locationType: "room"`, plus a supporter's surface things (a supporter is
always a visible surface per REQ-200) and a container's contents only when the
container is **open** (`!container.openable || container.open`; a closed
transparent container still hides its contents — transparency governs light,
not access), fixed things marked `(fixed)`, exits as bare directions, and
nothing else. GM additionally sees each visible thing as
`<name> (<id>, <kind>)`, exit targets, and the room's hazard `annotations`
serialized as one `**Annotations:**` line in the form
`encounter spill=<n> resource=<r>; trap snuff=<s> faces=<f>; npc <name>; lore <key>`,
carrying only keys present (`RoomAnnotations` at
`holonovel/src/world/model.ts:174-179`). Format is markdown, matching the
current handler; the Player view carries no ids. Rejected: render annotations
for the Player — REQ-622 hazard counts and the `npc`/`lore` pointers are GM
state and T245 asserts their Player absence.

**D3 — `thing://` payload and containment chain.** Export a
`containmentChain(world, thing): string[]` from `holonovel/src/world/model.ts`
returning `[thing.name, parent.name, …, room.name]`: at each step resolve the
location name in `world.things`; when it is absent there, resolve it in
`world.rooms` and emit the room name as the terminal element; stop when neither
map resolves it (and cap at the thing count so a corrupted `location` cannot
loop). Player sees `## name`, description, and the room-level location name only
when `locationType` is `"room"`. GM sees `**Location:**` plus the chain
(`crown → chest → Vault`), `**Properties:**` with portable/fixed, openable/open,
lockable/locked, transparent, readable, capacity (when set), key (when bound),
and `**Connects:**` for a door's `doorConnects`. Rejected: one shared "render
everything" formatter for both badges — REQ-202b's split is the contract, not a
formatting preference.

**D4 — `worldMap(world, badge)` gains a badge parameter.** Signature becomes
`worldMap(world: WorldModel, badge: "player" | "game_master" = "game_master")`
so existing callers keep the GM view. GM output appends, after the adjacency
lines, a `## Annotations` section with one line per annotated room listing the
present keys (`encounter spill=<n> resource=<r>`,
`trap snuff=<s> faces=<f>`, `npc <name>`, `lore <key>`); Player output stays the
adjacency list only. The handler's `mimeType` changes to `text/markdown` because
the GM view now emits a markdown heading (the Player view remains a plain
adjacency list, and no existing test pins the previous `text/plain`).
Rejected: a second `worldMapAnnotations` function — the adjacency graph and its
annotations are one resource, and T245 asserts both from one read.

**D5 — `worldKinds(badge, rulesetBound)` omits the parser catalog for the
bound-Player.** Signature becomes
`worldKinds(badge: "player" | "game_master" = "game_master", rulesetBound = true)`;
a Player read on a ruleset-bound Novel stops before `## Parser Commands` (so
`## Property Contracts` stays, both parser sections go). A Player read on a
ruleset-free Novel keeps the parser catalog, because REQ-309b's verb-name ban is
scoped to ruleset-bound Novels and ruleset-free mode makes the parser the
Player's primary surface (REQ-218/REQ-309h). All GM output is unchanged, so
`test-world-provider.ts`'s pure-function assertions keep passing; the new case
pins the bound-Player omission and the ruleset-free-Player inclusion. The
omission runs from `## Parser Commands` to the end of the document (nothing
follows `## Verb Coverage Tiers`). The handler derives the flag as
`!!novel.ruleset` — the same idiom as `spatialCmd` (`index.ts:4826`) — and
collapses `getBadge()`'s `"none"`/Editor to the GM view before calling the pure
function, so the parameter stays `"player" | "game_master"`. Rejected:
omit the catalog for every Player — it contradicts the rule-free branch of the
same REQ. Rejected: keep the catalog and strip the tier line — the verb names
themselves are the leak.

**D6 — Override attribution replaces the name comparison.** Add
`entities?: string[]` to the constraint-override entry (`holonovel/src/core/state.ts:753`)
as an implementation-level attribution field (REQ-325a enumerates the payload
fields; it does not forbid an attribution field). The Player filter becomes:
`o.match_all === true || (Array.isArray(o.entities) && entity && o.entities.includes(entity.id))`.
An entry with no `entities` and no `match_all` is GM-only because the server
cannot prove it belongs to the active entity, and a Player read with no active
entity returns only `match_all` entries. `match_all` is an existing field on
the entry (`holonovel/src/core/state.ts:753`). `spec_health.constraint_override_counts`
becomes `{ total, by_type, by_source }` (REQ-325a), computed from the same list,
with `by_type` keyed by the entry's `type` and `by_source` by its **mechanic
source** (`source`, e.g. `spell`); an entry missing a `source` counts under
`"unsourced"`. The field keeps today's badge scoping: GM reads the object,
Player reads `undefined` (`index.ts:12798`).
No writer is added: overrides arrive through Novel import/state today (no
server code populates `constraint_overrides`; `grep` over `holonovel/src`
finds only readers). The harness seeds them through the supported path —
`manage_archive (action: export, format: "json", scope: "full")` returns the
bundle text; edit `bundle.novel.constraint_overrides`, delete `bundle.integrity`
(the envelope covers the unedited payload; import warns `[integrity-absent]`
instead of refusing), then `manage_archive (action: import, mode: "replace",
data: …)` (export/import live on `manage_archive`, not `manage_novel`; see
`index.ts:12032`) — so the assertion does not depend on private state files.
No new persisted surface is introduced: `constraint_overrides` is an existing
Novel state array and `entities` is an optional field inside its entry. The
§7.7.0 class contract, the clone/checkpoint/archive enumerations
(REQ-240a/241a/334b), and `contract-fingerprints.ts` are therefore untouched;
Phase 4 records that determination in `aar.md` with the evidence line.
Rejected: filter on `prerequisites` satisfaction — prerequisites are free-text
("level 5", "1 slot", "Knock") and parsing them would invent semantics the
spec does not define. Rejected: `match_all`-only (Player sees everything) —
it makes REQ-325a's badge filter vacuous.

**D7 — Player spatial suggest names resolve with the player's words.**
`spatialCmd` gains a Player/ruleset-bound branch that returns
`run_command (action: resolve, intent: "<the caller's intent text>")`, using
the original intent rather than a parser verb phrase. That satisfies REQ-309g
("returns `run_command (action: resolve)` … never `command`") and REQ-309b (no
parser verb names in the Player result). The spatial domain must be deduped
(`[...new Set(domains.spatial)]`) before rendering, because several keyword
branches can match one intent and would otherwise emit the same resolve line
repeatedly. GM and ruleset-free Novels keep the current
`run_command (action: execute, "<cmd>")` form (REQ-309e's "prefer parser
`command` for spatial inspection"), and after the keyword scan GM gains one
`run_command (action: resolve, intent: "<intent>")` entry (only when the
spatial domain is non-empty) so REQ-309c's "under both badges" is literally
true. A ruleset-free Player keeps the `execute` form:
REQ-309b's verb-name ban is scoped to ruleset-bound Novels, and ruleset-free
mode makes the parser the primary Player surface (REQ-309b/REQ-309h/REQ-218).
Rejected: pass `"go <direction>"` to resolve —
it re-introduces parser verb names into Player output. Rejected: change GM to
resolve only — it contradicts REQ-309e.

**D8 — CRUD lifecycle.** `create_exit` gains an optional `door` argument: the
named thing must exist with `kind: "door"` (missing or non-door →
`[ERROR] [INVALID_INPUT]`; already bound to another exit →
`[ERROR] [STATE_CONFLICT]`); the branch sets
`roomA.doorRefs.set(dir, door.name)`, `roomB.doorRefs.set(opposite, door.name)`,
and `door.doorConnects = { roomA: roomA.name, roomB: roomB.name }`, inside the
existing `worldSnapshot()` so undo restores it. It writes the canonical
`roomB.name`/`roomA.name` into `exits` (today it stores the caller's raw
string, `index.ts:5726-5727`), so the reverse-exit guard below and case-mixed
callers agree. Before writing, the branch clears any
prior `doorRefs[dir]`/`doorRefs[opposite]` entry and that prior door's
`doorConnects`, so re-creating an exit with no `door` or a different door cannot
leave a stale blocking door. The branch currently snapshots before validating
(`holonovel/src/index.ts:5716` precedes `:5717-5725`), which leaves a no-op undo
entry on a rejected call; the plan moves `worldSnapshot()` after
direction/room/door validation, matching `remove_room`'s validate-then-snapshot
order (`:5618-5619`). The same defect is fixed in the `update_room` branch this
plan edits (snapshot at `:5607` precedes the `:5608-5609` not-found check);
`create_room`/`update_thing` keep the old order and are out of scope.
`remove_exit` removes the destination's opposite exit only
when it still points back at the source room
(`target.exits.get(opposite)?.toLowerCase() === args.room.toLowerCase()`),
clears both `doorRefs` entries, and clears the door's
`doorConnects` (the existing handler deletes only the source direction at
`:5741`, leaving a one-way edge). `remove_room` computes the removal set as a
fixpoint — start with things whose `location` case-insensitively names the room,
then repeat "add things whose `location` names a removed thing" until no new
thing is added — then deletes every exit pointing at the room in both
directions, clears the matching `doorRefs` and bound door things (including a
door in a surviving room; the audit counts those doors), deletes the room's own
exits and their doors, then the room. The audit entry records integer counts
`{ name, things: n, exits: n, doors: n }`. `update_room` audits
`{ name, fields }` where `fields` lists the changed keys. Rejected: auto-bind a door by scanning the
source room for an unbound door — direction is ambiguous with two doors and
would silently pick one. Rejected: leave the reverse exit in place — it is the
exact asymmetry `create_exit`'s implicit reverse creates, and a one-way edge
breaks `world://map` adjacency. Rejected: leave nested contents behind —
REQ-198 says "all contained things", and a container's contents are contained.

**D9 — Scope stop; the override hint envelope and its citation are scheduled.**
REQ-325b/c's blocked-error hint (vs. today's `resolved` + `override_hints`) and
REQ-325c's wrong `_Check:_ T369` (vow-countdown) are one scheduled item:
`F-5.10-1` in `spec/audit/review-register.md` (Scheduled-roadmap), with a
`ROADMAP.md` section. F-P6a-12's `constraints://active` clauses stay in scope;
the hint envelope and the Check repoint do not — repointing the Check now would
cite T372's hint clause while the plan defers implementing it, reproducing the
false-evidence defect the repoint exists to fix. Rejected: fix it in this
session — it changes `run_command (action: resolve)`'s result shape for every
locked-door call and would double the regression surface of an already large
increment.

## 5. Phases

### Phase 0 — Baseline, scaffold, and predicate re-check (S)

0. Move the drafted `plan.md`/`tasks.md` from the gitignored `plans/` tree
   into `docs/plans/2026-11-11-5-10-world-model-resources-crud/` and add an
   `aar.md` scaffold ending `LOOP OPEN`. This runs before any gate so
   Phases 0–1 can record evidence into a real file and `check-loop-artifacts`
   never sees a partial directory (a *missing* directory is safe; an
   *incomplete* one is not).
1. Run `npm run status` and `npm run check:fast` un-piped; record both in the
   scaffold.
2. Run `npm --prefix holonovel run typecheck`; record the exit status (the
   harnesses run under `tsx`, which does not type-check).
3. Re-confirm A–K (§3) with `grep -n`; a clause that already holds is dropped
   from the fix list and recorded as evidence in `aar.md`. Re-confirm the
   "holding" list too, since `worldKinds`' source rendering and the map
   adjacency are the two claims the register got wrong. Also grep the harnesses
   for `world://map` mime-type or `text/plain` assertions (D4 claims none pin
   the old value).
4. Run the baseline harnesses this plan depends on — `test:backfill`,
   `test:output-contracts`, `test:world-provider`, `test:world-remediation` —
   and record exit status. A red baseline is a P0 fixed first, as its own
   commit.
5. Reconcile Phase 1 against the Appendix F rows T241, T242, T245, T372 and
   classify each clause as **already stated** or **new appendix clause**. Known
   new clauses: T241's two-level removal and `remove_exit` reverse-exit,
   T245's bound-Player `world://kinds` omission and `trap` key, T372's
   `by_source` counts and `match_all` Player case.
6. **Sibling-contract grep.** Search the REQ corpus for `world://map`,
   `world://kinds`, `room://`, `thing://`, `constraints://active`,
   `parser_commands`, `doorRefs`, `doorConnects`, and the covered REQ IDs
   (REQ-198, REQ-199, REQ-202a/b, REQ-222b, REQ-309b/g, REQ-325a). Confirm no
   second REQ fixes the same payload; a conflict stops the run for a decision.
7. **Register cross-reference.** Grep `spec/audit/review-register.md` for each
   covered REQ ID, for F-P6a-12/13/14, and for `§5.10`; only those rows may cite
   them, and the `§5.10` hits decide the Phase 4 rewrite.
8. Confirm the increment directory created in step 0 is the only `docs/plans/`
   entry this session adds, and repeat the `constraint_overrides` writer grep
   over `holonovel/src` and `holonovel/dist` (excluding type/reader sites) to
   confirm D6's "no writer" premise.

### Phase 1 — Red and regression tests (M)

1. `test-backfill.ts`, widen T241 (`:444`): `create_room` `"Vault"`,
   `create_thing (name: "crown", kind: "thing", location: "Vault", fixed:
   true)`, `create_thing (name: "chest", kind: "container", location:
   "Vault")`, `create_thing (name: "gem", location: "chest")`,
   `update_room (name: "Vault", description: "A stone chamber.")`. Then assert
   `create_exit` returns `[OK]` and a reverse exit exists in the destination; a
   `take crown` returns `[RULE_VIOLATION]`; `list` rooms carry their `exits` and
   `get <room>` returns the exits map; a Player `list` returns `[FORBIDDEN]`;
   `remove_exit` removes the destination's opposite exit;
   `remove_room` removes the **two-level** chain (`gem` inside `chest` inside
   `Vault`) and both-direction exits, and the neighbour's `room://` no longer
   names the removed exit; a second `create_exit` bound to a door followed by
   `undo` leaves no `doorRefs`/`doorConnects`; a mixed-case `create_exit`
   (`room_a: "vault"` against room `"Vault"`) followed by `remove_exit` removes
   the destination's reverse exit; `resources/read` on `audit://novel` lists
   `create_room`, `create_thing`, `create_exit`, `update_room`, `remove_room`,
   and `remove_exit` (the resource renders one `timestamp | badge | tool | …`
   line per entry, `index.ts:13233-13252`); `manage_history (action: undo)`
   restores the room with its contents. Read the audit resource before the
   undo calls.
2. `test-backfill.ts`, widen T242 (`:455`): `create_room` `"hall"` and
   `"gallery"` in the active Novel, `create_thing (name: "oak key", location:
   "hall")`, create a door with `create_thing (name: "oak door", kind: "door",
   location: "hall", locked: true, key: "oak key")` — both parameters exist on
   the schema (`index.ts:5507-5512`), bind it with
   `create_exit (direction: "north", room_a: "hall", room_b: "gallery", door:
   "oak door")`, then `command("go north")` returns the closed-door block; the
   same from the gallery side; `command("unlock oak door with oak key")`
   succeeds; `undo` restores the locked state (`command("go north")` blocks
   again); `unlock` again, `command("open oak door")`, then `go north`
   succeeds. No binding-undo assertion here — `command` snapshots per call, and
   T241 owns that check.
3. `test-backfill.ts`, widen T245 (`:501`): `manage_novel (action: create,
   name: "w10-res")`, switch to it, then `manage_world (action: convert, source:
   <text>)` with a source containing
   `The Hall is a room. "A hall."`, `@encounter(The Hall) spill=3
   resource="Candle"`, `@trap(The Hall) snuff=doom faces=2 resource="Candle"`,
   `@npc(Hall Warden, The Hall) AC 12, HP 10.`, `@lore(The Hall) The walls
   remember.`, `The chest is a container. "A chest."`, `The chest is in The
   Hall.`, `It is open.`, `The gem is in the chest.`, `The box is a container.
   "A box."`, `The box is in The Hall.`, `The rune is in the box.` (CRUD cannot
   write `annotations`, and `convert` refuses a populated world). Then assert
   `room://` carries `**You can see:**` with `gem` (open container) and the
   fixed marker but not `rune` (closed container), and a GM read carries
   `**Annotations:**` with the exact D2 line (`encounter spill=3 resource=Candle;
   trap snuff=doom faces=2 resource=Candle; npc Hall Warden; lore hall` in key
   order); `thing://` GM carries `**Properties:**` with `portable=false` and a
   `→` containment chain ending at the room; Player `thing://` and `room://`
   carry no ids, property values, or annotations; Player `world://map` has no
   `## Annotations` and GM does; bound-Player `world://kinds` has neither
   `## Parser Commands` nor `## Verb Coverage Tiers`, GM has both, and an unset
   badge (`none`, Editor) gets the GM view. Switch back to the original Novel
   before the next test.
4. `test-backfill.ts`, widen the T96/T119/T120 suggest case (`:520`): reuse the
   `DATA_DIR/rulesets/<slug>` install helper and `manage_ruleset (action:
   bind)` sequence used near T255 (`:1608-1635`), create a Novel
   bound to it, and assert under the Player badge that `run_command (action:
   suggest, intent: "look around")` contains `run_command (action: resolve` and
   does not contain `(action: execute`; under the GM badge it contains
   `(action: execute` and `(action: resolve`; the ruleset-free `bf2` Novel's
   Player result keeps `(action: execute`. Restore `bf2` before the next test.
5. `test-world-provider.ts`: add a case asserting
   `worldKinds("player", true)` omits `## Parser Commands` and
   `## Verb Coverage Tiers`, `worldKinds("player", false)` keeps them, and
   `worldKinds()` still contains both.
6. `test-output-contracts.ts`, widen T372 (`:1575`): create a character,
   `manage_character (action: set_active, entity_id)` to make it active, then
   `manage_archive (action: export, format: "json", scope: "full")` — it
   returns the bundle as JSON text (`index.ts:11347`), not a file. Parse it,
   set `bundle.novel.constraint_overrides` to three entries:
   `{type: "door", name: "Knock", source: "spell", prerequisites: ["1 slot"],
   slots_remaining: 1, entities: ["<pc id>"]}`,
   `{type: "door", name: "Passwall", source: "spell", entities: ["<other id>"]}`,
   `{type: "door", name: "Darkvision", source: "spell", match_all: true}`; delete
   `bundle.integrity` (the export's integrity envelope covers the unedited
   payload, and import warns `[integrity-absent]` rather than refusing), then
   `manage_archive (action: import, mode: "replace", data: <bundle JSON>)`.
   Read `constraints://active` as GM (all three) and as Player with the first
   entity active (Knock + Darkvision) and with no active entity (Darkvision
   only); read `spec_health` under the GM badge (the counts field is GM-only,
   `undefined` for Player) and assert `total: 3`, `by_type: { door: 3 }`,
   `by_source: { spell: 3 }`.
7. Run `test:backfill`, `test:output-contracts`, and `test:world-provider`
   against the **unmodified** source and capture the failing positive
   assertions into `aar.md` before Phase 2 begins. Classify the **red** set
   (visible things, annotations, properties, containment chain,
   by_type/by_source, Player attribution, resolve mapping, two-level removal,
   CRUD door block) against the **green regression guards** (Player omission of
   ids/properties/annotations, Player map without annotations); only the red set
   must fail.

### Phase 2 — Resource payloads (M)

`holonovel/src/world/model.ts`:

- `worldMap(world, badge = "game_master")` with the GM annotation section (D4).
- `worldKinds(badge = "game_master", rulesetBound = true)` with the bound-Player
  omission (D5).
- `containmentChain(world, thing)` with cycle-safe parent walking (D3); add it
  (only it — `worldMap`/`worldKinds` are already imported) to `index.ts`'s
  model import block.

`holonovel/src/index.ts`:

- `room://` handler: D1 badge read, D2 payload.
- `thing://` handler: D1 badge read, D3 payload.
- `world://map` / `world://kinds`: pass `gameMaster ? "game_master" : "player"`
  to `worldMap`, and to `worldKinds` together with `rulesetBound =
  !!novel.ruleset`.
- `constraints://active`: D6 filter; `spec_health.constraint_override_counts`
  becomes `{ total, by_type, by_source }`.

`holonovel/src/core/state.ts`:

- Add `entities?: string[]` to the override entry type; the import/serialize
  paths already copy the array wholesale (`holonovel/src/core/state.ts:1654`,
  `:3017`), but Phase 3 confirms the round trip preserves the field before the
  T372 assertion depends on it.

### Phase 3 — Suggest mapping and CRUD (M)

`holonovel/src/index.ts`:

- `spatialCmd`: D7 branches.
- `create_exit`: optional `door` argument (schema, description, validation,
  binding); move `worldSnapshot()` after validation so a rejected call leaves no
  undo entry (D8).
- `remove_exit`: remove the destination's opposite exit only when it points back
  at the source room; clear `doorRefs` and `doorConnects` (D8).
- `remove_room`: fixpoint contents, both-direction exits, door cleanup, audit
  counts (D8).
- `update_room`: audit the changed fields and move `worldSnapshot()` after the
  not-found check (D8).
- `manage_world` schema/description updates for `door`.

### Phase 4 — Spec and registers (M)

1. `spec/appendices-reference.md`: rewrite T241, T242, T245, and T372 with the
   clauses Phase 0.5 classified as new. Where a new contract supersedes an old
   clause, replace it and record the replacement: T242's "undo reverts door to
   locked" now covers the unlock step above; T372's "only that override" now
   reads "the attributed override plus any `match_all` override". Do not append
   contradictory clauses. Leave T264 and T369 untouched; confirm T245's Player
   clauses match D2–D5 and its annotation line matches D2's exact format.
2. `spec/audit/review-register.md`: move F-P6a-12/13/14 under a new
   `### 2026-11-11 §5.10 resources, suggest, and CRUD` subsection of the
   existing `## Resolved` section, with post-change predicates and every covered
   REQ named. In each moved row, remove the `Scheduled under ROADMAP.md §
   §5.10 …` sentence and replace it with a note that the section was deleted. The
   three rows are the only bullets under the `### 2026-11-09 full-review sweep —
   chunk P6a (world model and the adapter seam)` heading that sits under
   `## Scheduled-roadmap` (`spec/audit/review-register.md:1625`); remove **that**
   heading only — the identically titled headings under `## Resolved` (`:370`)
   and `## Closed-P3 (recorded, no action)` (`:2164`) keep their bullets. Add `F-5.10-1` under a new
   `### 2026-11-11 §5.10 override hint envelope` subsection of
   `## Scheduled-roadmap`.
3. `ROADMAP.md`: delete the §5.10 resources/CRUD section (its trigger closes and
   it has no remaining bullets); add
   `## §5.10 constraint override hint envelope and REQ-325c Check (P1)` with a
   1–3 bullet entry and a `**Trigger:**` that closes when `F-5.10-1` is
   `Resolved`; `npm run check-roadmap`.
4. `npm run validate -- --write-register`; `npm run check-registers`,
   `npm run check-traceability`.
5. Record in `aar.md` the §7.7.0/Appendix M determination from D6 — the
   `entities` field sits inside the existing `constraint_overrides` array, so no
   class-contract or enumeration edit and no fingerprint regeneration.

### Phase 5 — Generated surfaces and bookkeeping (M)

1. Regenerate tool definitions (`manage_world` gained `door`):
   `npm run check-tool-definitions-sync` → regeneration when it reports drift;
   `tool-definitions-lint`, `check-tdqs-scoreboard`.
2. Confirm `npm run check-world-provider` is unaffected (D5 changes
   `worldKinds`' rendering, and the generated world-provider document may share
   it); regenerate via its emitter if the freshness gate fails.
3. `surface-budget` — run `-- --write` only when the footprint moved; refresh
   the DECISIONS action/token counts the gate reports.
4. `npm run assemble`; add the top `CHANGELOG.md` heading
   `## 2026-11-11 — §5.10 resources, suggest, and CRUD remediation` naming the
   scheduled override-hint row.
5. `npm run build-order` (CalVer/version sync, spec markers, fingerprint
   propagation).

### Phase 6 — Verify and close (S)

Run every command in §7, replace the `aar.md` scaffold with the final AAR, then
`npm run session:close`.

## Files expected

- `holonovel/src/index.ts`
- `holonovel/src/world/model.ts`
- `holonovel/src/core/state.ts`
- `holonovel/scripts/test-backfill.ts`
- `holonovel/scripts/test-output-contracts.ts`
- `holonovel/scripts/test-world-provider.ts` (Player-omission/inclusion case)
- `spec/appendices-reference.md` (T241, T242, T245, T372)
- `spec/audit/review-register.md`
- `spec/audit/req-coverage.md` (regenerated)
- `holonovel/tool-definitions.json`, `holonovel/tool-surface-registry.json`
  (regenerated for the `door` argument)
- `spec/audit/tool-surface-baseline.json` (only if the budget moves)
- `holonovel.md`, `holonovel/holonovel.md` (assembled)
- `ROADMAP.md`, `CHANGELOG.md`
- version-sync surfaces advanced by `build-order` (`holonovel/AGENTS.md`,
  `holonovel/DECISIONS.md`, `holonovel/package.json`, the lockfile,
  `server.json`; REQ-107a)
- `docs/plans/2026-11-11-5-10-world-model-resources-crud/{plan,tasks,aar}.md`

## 6. Blast radius and rollback

| Surface | Change | Size |
|---|---|---|
| `index.ts` | four resource handlers, suggest branch, four CRUD branches, health counts | M |
| `world/model.ts` | `worldMap`/`worldKinds` badge parameter, `containmentChain` | S |
| `core/state.ts` | one optional attribution field | S |
| `test-backfill.ts` | T241, T242, T245, suggest case widened | M |
| `test-output-contracts.ts` | T372 widened | S |
| `test-world-provider.ts` | Player-omission case | S |
| `spec/appendices-reference.md` | four rows widened | S |
| `spec/audit/review-register.md` | three rows resolved, one scheduled, empty chunk subsection removed | S |
| `ROADMAP.md`, `CHANGELOG.md` | section replaced, dated heading added | S |
| generated manifests | tool definitions, surface registry, budget baseline | S |
| `holonovel.md`, `holonovel/holonovel.md` | assembled from `spec/` | S |
| version-sync surfaces | `holonovel/AGENTS.md`, `holonovel/DECISIONS.md`, `holonovel/package.json`, lockfile, `server.json` (REQ-107a) | S |
| `docs/plans/…/{plan,tasks,aar}.md` | created in Phase 0; gates `check-loop-artifacts` | S |
| `holonovel/src/generated/contract-fingerprints.ts` | not expected (§5.10/Appendix F outside both section lists; D6 adds no §7.7 surface) | — |

Rollback cost 1: every edit is a reversible source or spec edit. The Novel
state change is one optional field with an absent-means-GM-only default, so an
older save loads unchanged and an older server ignores the field.

## 7. Verification

| Step | Command | Expectation |
|---|---|---|
| Red tests | `test-backfill`, `test-output-contracts`, `test-world-provider`, pre-fix | each **new positive** assertion fails (recorded); omission assertions are green guards; `test:world-remediation` is green-only |
| Targeted harnesses | `npm --prefix holonovel run test:backfill`, `test:output-contracts`, `test:world-provider`, `test:world-remediation` | exit 0 |
| Server types | `npm --prefix holonovel run typecheck` | exit 0 |
| REQ shape | `npm run validate --sdd-strict` (reads assembled output; run after `assemble`) | 0 errors |
| Assembled spec | `npm run assemble` | exit 0 |
| Fast gates | `npm run check:fast` (un-piped) | exit 0, `check:fast: PASS` |
| Full gates | `npm run check` | 0 errors |
| Registers | `check-registers`, `check-roadmap`, `check-traceability`, `check-loop-artifacts` | PASS |
| Tool surface | `check-tool-definitions-sync`, `tool-definitions-lint`, `check-tdqs-scoreboard`, `surface-budget`, `check-world-provider` | PASS |
| Full pipeline | `npm run build-order` | completes |
| Close | `npm run session:close` | one commit |

## 8. Risks, edge cases, assumption audits

- **Stale output assertions.** `worldKinds()` is called as a pure function in
  `test-world-provider.ts`; the default parameter must stay `"game_master"` so
  its existing assertions keep their current behavior. Phase 0 records the
  current default output as the regression baseline.
- **Annotation shape drift.** GM map and `room://` annotations render the keys
  `RoomAnnotations` actually carries — `encounter`, `trap`, `npc`, `lore`
  (`holonovel/src/world/model.ts:174-179`); a room with no annotations emits no
  line, so an empty world still renders.
- **Containment cycles.** `containmentChain` caps at the world's thing count and
  stops on a repeated name so a corrupted `location` cannot hang a resource
  read.
- **Badge switch mid-session.** Each resource call re-reads `getBadge()`; no
  cached view. T245 asserts Player, GM, and unset (`none`/Editor) from one
  process; `observer` follows the Player view.
- **Overrides with no attribution.** Existing imported Novels carry override
  entries without `entities`; they become GM-only rather than disappearing, so
  no data is lost and the GM surface is unchanged. A Player read with no active
  entity returns only `match_all` entries.
- **`constraint_override_counts` shape change.** The only consumer in
  `holonovel/src` is the T372 presence check; the plan updates it in the same
  phase. Phase 0 greps `holonovel/scripts` for the field before the shape
  change; any consumer outside this repo is out of contract (it is a
  `spec_health` field).
- **Door rebinding.** `create_exit` clears the prior direction's `doorRefs` and
  that door's `doorConnects` before writing, so re-creating an exit without a
  door cannot leave a ghost blocker; Phase 1 asserts the undo path restores the
  captured state.
- **Reverse-exit guard.** `remove_exit` deletes the destination's opposite exit
  only when it points back at the source room; a hand-built asymmetrical world
  keeps its unrelated edge.
- **Door binding conflicts.** A `door` argument naming a non-door or a door
  already bound returns `[INVALID_INPUT]`/`[STATE_CONFLICT]` without mutating;
  D8 moves the snapshot after validation, so a rejected call leaves no undo
  entry (the current `create_exit` snapshots first and does leave one).
- **`remove_room` widening.** The fixpoint is destructive but undo-able through
  `worldSnapshot()`; the audit entry names things/exits/doors counts, not a
  silent delete. A bound door in a surviving room is deleted and counted —
  leaving it would dangle a `doorConnects` into a removed room.
- **Suggest format.** T96's existing `Spatial` assertion stays true; the new
  assertions check substrings, not an exact block, so mechanical/social blocks
  can still change independently.
- **Tool-surface movement.** The `door` argument edits the `manage_world`
  description; `surface-budget --write` runs only if the gate reports a move,
  and the DECISIONS counts are refreshed in the same phase.
- **Fingerprint expectation.** D6 adds no §7.7.0 surface, so
  `contract-fingerprints.ts` is untouched; a `check-fingerprint-sync` failure
  means an out-of-scope §7.7/Appendix Q section was edited — stop and
  investigate rather than regenerating.
- **World-provider document.** D5 changes `worldKinds`' rendering; Phase 5.2
  runs `check-world-provider` and regenerates through its emitter if the
  generated document shares the rendering and goes stale.
- **Assumption audited in Phase 0.** "No server code populates
  `constraint_overrides`" rests on a `grep` over `holonovel/src` this session;
  Phase 0 repeats it against the built tree (`holonovel/dist` excluded), so a
  later addition cannot silently make D6's default wrong.
- **No new gate.** No check is installed; the reused gates are listed in §7.

## 9. User impact

Caller-visible changes, all required by the covered REQs:

1. `room://`, `thing://`, `world://map`, and `world://kinds` are badge-filtered:
   the Player sees descriptions, visible things, exits, and kind/property
   contracts; the GM (and the Editor/`none` badge) additionally sees ids,
   property values, containment chains, exit targets, and hazard annotations.
   On a ruleset-bound Novel the Player also stops seeing parser verb names
   through `world://kinds`; ruleset-free Novels keep the catalog.
2. `constraints://active` returns the active entity's attributed overrides plus
   `match_all` for the Player; `constraint_override_counts` changes shape from a
   number to `{ total, by_type, by_source }` (a breaking change for any consumer
   that read the number).
3. Player spatial suggestions on a ruleset-bound Novel name
   `run_command (action: resolve)`; GM suggestions name both `resolve` and
   `execute`; a ruleset-free Player keeps `execute`.
4. `manage_world (action: create_exit)` accepts an optional `door`, so a
   CRUD-created door blocks passage; `remove_exit` removes the reverse exit and
   cleans door references; `remove_room` removes the transitive content set;
   `update_room` is audited.

No tool is renamed, no existing parameter changes meaning, no REQ body or Check
changes, and the one persisted field (`entities`) is optional, so a Novel saved
before this increment loads unchanged.

## 10. Open questions

None. The roadmap bullet fixes the scope; the adjacent contract defect
(REQ-325b/c hint envelope) and the wrong REQ-325c Check are one scheduled item
(`F-5.10-1`) rather than folded in, so this plan edits no REQ.
