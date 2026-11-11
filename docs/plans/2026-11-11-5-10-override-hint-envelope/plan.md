# Plan — §5.10 override hint envelope and REQ-325c Check

Status: draft · Kind: planned · Depth: standard · Independence: fresh
Increment target: `docs/plans/2026-11-11-5-10-override-hint-envelope/`
Rollback cost: 1 (reversible source and spec edits; one spec increment, one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the first open `ROADMAP.md` section — **§5.10 constraint override hint
envelope and REQ-325c Check (P1)** (`ROADMAP.md:15-23`) — and close its single
finding:

- **F-5.10-1 — override hint envelope and the REQ-325c Check
  (2026-11-11).** REQ-325b requires an *error* response that cites a
  world-model constraint to carry an override hint, but
  `run_command (action: resolve)` returns `status: "resolved"` with an
  `override_hints` array when a matching override exists
  (`holonovel/src/index.ts:6147-6176`). The door is never opened, yet the
  resolution composes and returns the destination room context — the result
  claims arrival through a closed door. The same scan compares the override's
  mechanic name (`Knock`) to the *door's* name, so a real catalog entry is
  invisible unless it is `match_all` (`:6156-6160`). REQ-325c cites T369
  (vow-countdown) instead of the catalog row T372
  (`spec/02-requirements.md:3441`; `spec/appendices-reference.md:1824`).
  The scan's badge breadth is **not** a defect: REQ-325c requires a GM-badge
  error to enumerate all known overrides, so a foreign-entity entry appearing
  under `game_master` is the contract (the Player-only filter is exercised on
  the resource by T372).

**Done bar** (each item names its command or artifact; no conditional clause)

1. F-5.10-1 appears under a new `### 2026-11-11 §5.10 override hint envelope`
   subsection of `## Resolved` in `spec/audit/review-register.md`, with a
   post-change `file:line` predicate that resolves on the committed tree and
   every covered REQ named; the `## Closed-P3` entry records the residuals in
   D7 and D8.
2. The `## §5.10 constraint override hint envelope and REQ-325c Check (P1)`
   section is deleted from `ROADMAP.md`; `npm run check-roadmap` passes.
3. The new T370 assertions fail on the pre-fix tree (output recorded in
   `aar.md`) and pass after the fix; the widened T372 assertions pass both
   before and after (contract catch-up, not a behavior fix) and are recorded
   as such. `npm --prefix holonovel run test:output-contracts`,
   `test:backfill`, and `test:all` exit 0.
4. `run_command (action: resolve, "go north")` against a locked door with an
   applicable override returns `status: "blocked"`, `constraint: "locked"`, a
   `reason`, and `override_hints` containing the pinned line
   `Knock (1 slot remaining) can open it.`; with no applicable override the
   same call returns blocked with no `override_hints` entry; the Player badge
   still returns `[FORBIDDEN]`; an unpopulated world still returns
   `no_world_model`.
5. REQ-325c's `_Check:_` cites `T370, T372` (T369 removed), REQ-326d's
   `_Check:_` stops citing T370 and names T373, and Appendix F's T370 row
   states the blocked assertion and cites REQ-323 and REQ-325;
   `npm run validate --sdd-strict` reports 0 errors.
6. `npm run assemble` and `npm run check:fast` exit 0 un-piped with the
   trailing `check:fast: PASS` line; `npm run check` reports 0 errors;
   `npm run build-order` completes.
7. `aar.md` ends `LOOP PAUSED`; the increment lands as one commit via
   `npm run session:close`.

**Explicitly out of scope.** The P2 `Harness test-ID label hygiene` roadmap
item's zero-padded-token sweep and the `T408`–`T412` duplicates. This plan
does correct the four T-tokens in the scene/world tests it touches (D5, D6)
because a cited T370/T373 must resolve to the assertion it names; the broader
sweep stays scheduled. REQ-324's `T371` builder-side row loses its
(never-faithful) server-harness carrier; bucket E makes that an intended gap
(`spec/audit/req-coverage.md:293`), and the disposition is recorded in the
review register's `Closed-P3` list rather than deferred to a trigger that does
not cover it. REQ-323a's dangling "Return values are defined in Appendix O"
pointer (Appendix O has no resolve-return subsection) is recorded the same
way, not amended here.

## 2. Verified baseline

- `npm run status` (this session): 48 unpushed commits, 15 open roadmap items,
  version `2026.11.11`, last publish `2026-11-09T04:30:29.593Z` (`repo`).
- `npm run check:fast` (this session): **40 passed, 0 failed**, trailing
  `check:fast: PASS`, exit 0 (`repo`). Baseline is green; no pre-fix commit.
- `npm --prefix holonovel run test:output-contracts` (this session):
  **385 passed, 0 failed** (`repo`), so the carrying T372 assertion is green
  before the red-test step.
- `plans/` is gitignored (`.gitignore:13`), so this draft lives in the
  scratch tree and moves to `docs/plans/` with `tasks.md` and `aar.md` at
  execution time (`repo`).
- §5.3 (REQ-323), §5.10 (REQ-325), and Appendix F are outside
  `DATA_SECTIONS`/`PACKAGE_SECTIONS` (`scripts/lib/contract-fingerprint.ts`),
  so no fingerprint regeneration is expected; `check-fingerprint-sync` runs
  anyway inside `check:fast` (`repo`).

## 3. Evidence (re-derived this session)

**Still open (defects):**

| # | Predicate | Current code |
|---|---|---|
| A | A door override makes `resolve` return `resolved` with the destination `room_context`, although the door is never opened | `holonovel/src/index.ts:6147-6176` |
| B | The hint scan matches `o.name` (a mechanic name) to the door name; the entry's `type` — the constraint class REQ-324/325 key on — is only checked as a coarse `"door"` gate, so a `Knock` entry matches a door only when `match_all` is set | `index.ts:6156-6160`; entry shape `core/state.ts:753` |
| C | REQ-325c cites T369 (vow-countdown), not T372 | `spec/02-requirements.md:3441`; T369 at `appendices-reference.md:1824` |
| D | Test-ID labels are misassigned across the world tests: `T370` on a scene-coupling test (`test-output-contracts.ts:1526`) and on a backfill resolve smoke check (`test-backfill.ts:713`); `T373` on a countdown test (`:780`); `T374` on a knowledge test (`:728`); REQ-326d also cites T370 for scene coupling | `appendices-reference.md:1825-1832`; `spec/02-requirements.md:3452` |
| E | T372 asserts containment of names only — no `type`/`source`/`prerequisites` per entry and no Player absence of `constraint_override_counts` | `test-output-contracts.ts:1575-1630` vs `appendices-reference.md:1827` |

**Re-audited as holding (close with evidence, no edit):**

- The `constraints://active` resource already badge-filters by `match_all` or
  `entities.includes(activeEntityId)` (`index.ts:13699-13706`) and
  `constraint_override_counts` already reports `{ total, by_type, by_source }`
  GM-only (`:12884-12895`) — resolved 2026-11-11, F-P6a-12.
- `resolve` refuses the Player badge before resolution starts
  (`index.ts:4814-4822`) and then calls `requireNotObserver()`
  (`:4819`; `core/server.ts:30`), so the hint scan is reachable only under
  `game_master` or `none` (Editor). The observer branch of the catalog
  predicate is therefore unreachable through `resolve`, and this plan does
  not change observer output.
- §5.10's conflict order requires an **explicit named mechanic** before a
  world constraint is suspended — "the ruleset cannot silently contradict
  world-model state" (`spec/02-requirements.md:3174-3178`), which is why a
  bare catalog entry must not produce `resolved`.
- The blocked payload fields `status`/`constraint`/`reason` are already the
  documented shape for the other refusal branches (`index.ts:6141`, `:6144`,
  `:6168`, `:6171`).
- Appendix F T370 and T372 rows exist (`appendices-reference.md:1825`,
  `:1827`); the coverage register already maps REQ-325 → T372 and REQ-323 →
  T370 (`spec/audit/req-coverage.md:292-294`).

**Carrying assertions.** T372 (`test-output-contracts.ts:1575`) passes today
and covers the resource and counts, so its widening is a catch-up to the row
it already cites, not a failing assertion — the resource already serializes
the injected `type`/`source`/`prerequisites` fields (`:1586-1598`) and
`constraint_override_counts` is already `isGM`-conditional
(`index.ts:12884-12895`), so the widened T372 passes pre-fix and must stay
green. T370's resolve row has no faithful harness: `test-backfill.ts:713`
asserts only `status === "resolved"` for "I open the door" on a fixture world,
and `test-output-contracts.ts:1526` is scene coupling. The new T370 test
therefore lives in `test-output-contracts.ts`, whose archive-export/import
helper is the only way to inject `constraint_overrides` (no tool writes them;
same technique as T372 at `:1584-1592`).

**Contract conflict resolved in-plan.** REQ-323a's "three phases: constraint
check, override check, and scene composition" reads as if an available
override unblocks passage. §5.10's explicit-mechanic rule and REQ-325b's
"Error responses … SHALL include override hints" settle it: the override
*check* discovers an available mechanic and returns a hint on the blocked
result; it does not apply the mechanic. D1 records the reading; no REQ-323
body edit.

**Sibling-contract scan.** `grep` over `spec/` for `override_hints`: only
Appendix F T370. REQ-084b requires `suggest` to incorporate the resolve
response's override hints, which D3 keeps intact. No other REQ binds
`run_command (action: resolve)`'s success/blocked semantics.

**Generated-surface coupling.** No input schema, parameter description, or
tool title changes, so `generate-tool-definitions.ts`, `generate-world-provider.ts`,
and the starter Novel emitter are untouched; `check-tool-definitions-sync`
verifies that claim rather than regenerating. The action declaration for
`run_command.resolve` (`holonovel/tool-surface-registry.json:4709-4719`:
group `explore`, phases `scene`/`combat`, `mutation_class: "read"`, no
preconditions or successors) and the routing phrase list
(`holonovel/tool-routing.json:39-46`) describe the action's identity, not its
result shape, so neither artifact changes; `check-tool-surface`,
`surface-budget`, and `action-conflicts` confirm it in `check:fast`.

## 4. Decisions

**D1 — A constraint block stays blocked.** The door branch returns
`{ status: "blocked", constraint, reason, override_hints? }` in both cases;
`resolved` is returned only after the world state actually permits passage.
`reason` keeps the existing wording (`The <name> is locked.` / `… is closed.`)
and `override_hints` is present only when the catalog offers an applicable
mechanic. Rejected: keep `resolved` with hints — it reports arrival while the
door remains closed, so the narrator would move the party through a door the
world model still considers shut. Rejected: auto-apply the override on a
catalog hit — an unused preparation is not an enacted mechanic, and §5.10
forbids the silent contradiction.

**D2 — Match the constraint class, not the mechanic name.** A door constraint
(`constraint` = `locked` or `closed_door`) is bypassed by any visible override
whose `type` is `door`; the override's `name` is the mechanic to cite, never a
key into the door. The class table lives in one comment-annotated helper
(`doorConstraintOverrides`) so a future constraint class adds one row rather
than a second comparison. Rejected: keep name equality — `Knock !== door name`
makes every real catalog entry invisible, and `match_all` was the only path
that worked.

**D3 — Pinned hint text, existing field.** Each hint entry is
`<mechanic> (<n> slot[s] remaining) can open it.` when `slots_remaining` is a
number and `<mechanic> can open it.` otherwise — the REQ-325b example minus
its `Hint: ` prefix, which is a text-channel marker the structured result does
not carry. `override_hints` stays the field name (Appendix F T370 and REQ-084b
already bind it); no new `hint` field. Rejected: add a single `hint` string —
two representations of one fact, one of which would rot.

**D4 — One visibility predicate, shared with the resource.** Extract
`visibleConstraintOverrides(novel)` beside the `constraints://active` handler
and use it from both the resource and the resolve hint scan. Visibility stays
exactly the resource's current rule — `player` sees `match_all` plus entries
whose `entities` list contains the active entity id; every other badge
(including `observer`) sees all (`index.ts:13699-13706`) — so the refactor is
behavior-neutral and observer output is unchanged. `resolve` refuses Player
(`:4816-4817`) and observer (`:4819`; `core/server.ts:30`), so its hint scan
only ever reads the unfiltered branch, which is what REQ-325c's GM clause
requires. Rejected: apply the Player filter to observer — no REQ binds observer
catalog reads. Rejected: duplicate the filter in the resolve branch — the
resource and the hint would drift exactly as they did before.

**D5 — One owner for T370.** Move the full resolve contract to
`test-output-contracts.ts` as `T370/REQ-323 + REQ-325` (rooms, locked door,
injected override, foreign-entity override under the GM clause, no-override,
exit, forbidden, no-world-model, and the tool's presence in `tools/list`).
Retitle the scene-coupling test at `:1526` to
`T373/REQ-326 + T374/REQ-327` (its actual assertions per Appendix F), which
requires freeing both tokens: `:780` becomes `T376/REQ-329: countdown
on_room_enter trigger advances` and `:728` becomes
`T352/REQ-308 + T377/REQ-330: knowledge gating by presence and exploration`.
That also drops the `T371` token, which no server harness ever implemented
(D8). Retitle `test-backfill.ts:713` to
`REQ-323: resolve intent returns structured intent resolution (supplemental)`
so it keeps its coverage without claiming T370. Rejected: preserve `T371` on
the scene test — it is false evidence for a builder-side extraction row.
Rejected: leave the collisions — a cited T370/T373 would resolve to whichever
harness the coverage tool saw first, the exact false-evidence class the P2
item records.

**D6 — T370 has one spec owner per clause.** REQ-326d cites T370 for
scene-world coupling (`spec/02-requirements.md:3452`); after D5, T370 means the
resolve contract, so its `_Check:_` becomes `T373` — the Appendix F row whose
text is scene-world coupling (`appendices-reference.md:1828`) and, after D5,
the only harness carrying T373. REQ-325c becomes `T370, T372`. This is a
deliberate widening of the roadmap's literal "repoint to T372": T372 exercises
the catalog and its badge filter, not the blocked-error hint envelope, so
citing it alone would leave the hint clause evidenced by nothing.

**D7 — The Player-badge hint clause stays unexercised by design.** REQ-325c's
"Player-badge errors SHALL enumerate only the active entity's overrides" cannot
be reached through `resolve` (REQ-323a forbids Player; observer is refused),
and no other surface emits a constraint-citing error with catalog hints. The
Player-facing badge-filtered catalog surface is `constraints://active`, which
T372 exercises. The plan records the vestigial clause as a `Closed-P3` register
entry (unreachable, not wrong; the catalog filter carries the contract) rather
than amending REQ-325c's body or opening roadmap work.

**D8 — GM hint breadth is the contract, and the label corrections are recorded.**
The hint scan stays unfiltered for `game_master`/`none`, because REQ-325c
requires GM-badge errors to enumerate all known overrides; the T370 test
asserts a foreign-entity override appears in a GM hint and names the REQ-325c
clause. The four label corrections in D5 and REQ-324's now-carrierless `T371`
(bucket E) are recorded in a `Closed-P3` register entry with the predicate and
the disposition, so no correction lives only in the AAR.

## 5. Phases

### Phase 0 — Predicate re-check (S)

- Re-run `grep -n` for predicates A–E and drop any that already holds.
- `grep -n "T370"`, `"T371"`, `"T372"`, `"T373"`, `"T374"`, `"T376"`,
  `"T377"` across `holonovel/scripts`; confirm the four title sites in D5 and
  that T370 and T373 have exactly one carrier after the edits.
- `grep -n "T370" spec/02-requirements.md`; confirm REQ-326d (`:3452`) is the
  only additional Check citation and that D6 covers it.
- Confirm `plans/…` is ignored and the increment directory does not exist.

### Phase 1 — Red tests (M)

- `holonovel/scripts/test-output-contracts.ts`: widen T372 to assert each
  override's `type`, `source`, and `prerequisites`, and that a Player
  `manage_diagnostics (action: health)` omits `constraint_override_counts`
  (these pass pre-fix by construction — record that, do not claim red).
- Add `T370/REQ-323 + REQ-325` in the same file using the T372 import helper:
  Entrance → Hall, Hall → Chapel with a locked north door; assert resolved
  northbound from Entrance; blocked `locked` with no hints from Hall; inject
  `{ type: "door", name: "Knock", source: "spell", prerequisites: ["1 slot"],
  slots_remaining: 1, entities: [pcId] }`; assert blocked `locked` with
  `Knock (1 slot remaining) can open it.`; inject a second override
  (`Passwall`, `entities: ["character_99"]`) and assert it appears in the GM
  hint list (REQ-325c's GM clause, D8); assert blocked `exit` for `go east`;
  assert Player `[FORBIDDEN]`; assert `no_world_model` on a fresh Novel; assert
  `run_command` appears in `tools/list`.
- Retitle `:1526` to `T373/REQ-326 + T374/REQ-327`; retitle `:780` to
  `T376/REQ-329: countdown on_room_enter trigger advances`; retitle `:728` to
  `T352/REQ-308 + T377/REQ-330: knowledge gating by presence and exploration`;
  retitle `test-backfill.ts:713` as in D5.
- Run both harnesses; record the failing T370 assertions (and the passing T372
  catch-up) in `aar.md`.

### Phase 2 — Implementation (M)

- Add `visibleConstraintOverrides(novel)` in `holonovel/src/index.ts` next to
  the `constraints://active` handler; rewire the handler to it (no behavior
  change).
- Rewrite the door branch of `resolveIntentWorld` (`:6147-6165`) per D1–D3:
  compute the hints through the helper and `doorConstraintOverrides`, then
  return blocked with `constraint`, `reason`, and `override_hints` when
  non-empty.
- Comment the class table with REQ-325b and keep the block non-mutating (no
  snapshot, no door state change).

### Phase 3 — Spec, register, roadmap, changelog (M)

- `spec/02-requirements.md:3441`: `_Check:_ T369.` → `_Check:_ T370, T372.`
  (body stays 514 characters / 7 sentences — inside the 800/8 limits).
  `:3452` (REQ-326d): `_Check:_ T370.` → `_Check:_ T373.` (D6).
- `spec/appendices-reference.md:1825`: T370 row — replace "Create character
  with Knock spell — create override entry … assert `override_hints` includes
  Knock" with the injected-override blocked assertion and the pinned hint
  text, drop the `help("run_command (action: resolve)")` sentence (no harness
  implements an action-level help surface and REQ-323 does not require one),
  and cite `REQ-323, REQ-325`.
- `spec/audit/review-register.md`: delete the
  `### 2026-11-11 §5.10 override hint envelope` heading and its F-5.10-1 row
  from `## Scheduled-roadmap` (`:1644-1652`), and add the same heading with
  the rewritten row under `## Resolved`, carrying the post-change `file:line`
  predicates and REQ-323/REQ-325 named — one heading, moved, not duplicated.
  Add a `## Closed-P3` entry (D7/D8) recording the unreachable Player hint
  clause, the four corrected harness labels, and REQ-324's carrierless `T371`
  row, each with its predicate and reason.
- `ROADMAP.md`: delete the `§5.10 constraint override hint envelope…` section
  (lines 15–23).
- `CHANGELOG.md`: add a **new** dated heading
  (`## 2026-11-11 — §5.10 override hint envelope remediation`) with one bullet
  group covering the blocked hint envelope and the citation repairs;
  `session:close` derives the commit subject from the top heading
  (`scripts/session-close.ts:246-257`), so appending under the previous
  increment's heading would misfile the commit.
- `npm run assemble`; then `npm run validate -- --write-register`
  unconditionally — the T370 row's added REQ-325 owner changes REQ-325's
  exercised set from `T372` to `T370, T372` (`spec/audit/req-coverage.md:294`),
  so the register always drifts (m1).

### Phase 4 — Verification (S)

Commands in §7, in order; stop at the first failure rather than folding a fix
into the increment blindly.

### Phase 5 — Close (S)

- Write `tasks.md` checkmarks and `aar.md` (baseline, red-test output, gate
  evidence, findings with P0–P3 dispositions, `LOOP PAUSED`).
- Move the increment to `docs/plans/2026-11-11-5-10-override-hint-envelope/`
  and commit once via `npm run session:close`.

## Files expected (blast radius)

| File | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | `visibleConstraintOverrides` helper; resource rewire; blocked door branch with hints | M |
| `holonovel/scripts/test-output-contracts.ts` | T372 widened; new T370 test; `:1526`, `:780`, `:728` retitled | M |
| `holonovel/scripts/test-backfill.ts` | `:713` retitled | S |
| `spec/02-requirements.md` | REQ-325c and REQ-326d `_Check:_` repointed | S |
| `spec/appendices-reference.md` | T370 row assertions and REQ citations | S |
| `spec/audit/review-register.md` | F-5.10-1 → Resolved | S |
| `spec/audit/req-coverage.md` | regenerated (`--write-register`); REQ-325 exercised set gains T370 | S |
| `ROADMAP.md` | section deleted | S |
| `CHANGELOG.md` | dated entry | S |
| `docs/plans/2026-11-11-5-10-override-hint-envelope/{plan,tasks,aar}.md` | increment artifacts | M |
| `holonovel.md` (generated), `holonovel/holonovel.md` (build-order) | assembled spec, no hand edit | S |
| `holonovel/tool-surface-registry.json`, `holonovel/tool-routing.json` | verified unchanged (action identity, not result shape) | — |

## 6. Rollback

Every edit is a source/text change on one tree, reversible with
`git checkout -- <path>`; no persisted Novel schema, no migration, no
generated-artifact format change. The single commit is revertible as a unit.
Rollback cost: 1.

## 7. Verification

| Step | Command | Expected |
|---|---|---|
| Red/green harnesses | `npm --prefix holonovel run test:output-contracts`, `test:backfill` | pre-fix: the new T370 assertions fail, widened T372 passes; post-fix: 0 failures |
| Server suite | `npm --prefix holonovel run test:all` | 0 failures; catches any harness that resolved through a bound door (D1's blast radius) |
| Spec assembly | `npm run assemble` | regenerated `holonovel.md` includes both repointed Checks |
| Register regeneration | `npm run validate -- --write-register` | REQ-325 exercised set shows `T370, T372` |
| Strict validation | `npm run validate -- --sdd-strict` | 0 errors |
| Registers | `npm run check-registers`, `npm run check-roadmap` | PASS |
| Fast gates | `npm run check:fast` (un-piped) | 40/40, `check:fast: PASS` |
| Full gates | `npm run check` | 0 errors |
| Pipeline | `npm run build-order` | completes, 0 errors |

## 8. Risks and edge cases

- **Unblocking a legitimate override.** If a caller (narrator) relied on
  `resolved` to narrate passage, it now sees blocked plus a hint and must
  apply the mechanic. `grep` finds no code consumer of `status` beyond
  `take_turn`/`suggest` text rendering, so the blast radius is the narrator's
  interpretation; the hint names the mechanic to enact.
- **Closed-but-unlocked doors.** The class table covers `closed_door` as well
  as `locked`, because the catalog entry carries only `type`. Tests assert the
  locked branch; the closed branch keeps the existing reason wording.
- **Archive injection ordering.** The T370 fixture must set the active entity
  before export so the override's `entities` id survives the round trip
  (T372's pattern). An import replaces the Novel, so the world model and
  entity must be built before export or re-derived after import.
- **Hint wording drift.** The pinned string is asserted literally in T370 and
  restated in Appendix F; both change in the same commit.
- **Hint breadth.** The GM hint list is intentionally unfiltered by entity
  (REQ-325c's GM clause), so a foreign override appears there; the T370 test
  pins that, and the Player-only catalog filter lives on the resource (T372).
- **Observer output.** D4 preserves the resource's current predicate, so
  `constraints://active` returns the same payload to every badge; only the
  T370 test asserts the Player filter, and no test asserts observer filtering
  (none exists to change).
- **Generated-surface false alarm.** Any tool-definition drift reported by
  `check-tool-definitions-sync` is investigated, not regenerated blindly —
  this plan changes no schema text.

## 9. User impact

No new tool, parameter, or persisted field. The observable change is that
`run_command (action: resolve)` reports a blocked door it previously reported
as resolved, with the mechanic that can bypass it. Narrators get one extra
step per overridden obstacle; Players are unaffected (resolve stays
`[FORBIDDEN]`). No restart or data migration beyond the normal publish.

## 10. Open questions

- None blocking. Whether `run_command (action: execute)` should also emit
  catalog hints on `open`/`go` failures is deliberately left to a later
  increment; REQ-284 already owns the key-hint surface and this roadmap item
  names `resolve` only.
