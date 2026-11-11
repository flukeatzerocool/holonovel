# Plan — §5.10 observer badge parser access

Status: draft (revised after the cold pass) · Kind: planned · Depth: standard ·
Independence: fresh (cold pass: `independent-review.md`)
Increment target: `docs/plans/2026-11-11-5-10-observer-badge-parser-access/`
Rollback cost: 1 (reversible code, spec, and harness edits; one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the first open `ROADMAP.md` section — **§5.10 observer badge parser
access (P1)** (`ROADMAP.md:15-24`) — and close it. The section was scheduled by
the previous increment as `F-5.10-2`
(`spec/audit/review-register.md:1684-1692`).

**Decision: implement observer read-only parser access uniformly on both Novel
types.** The roadmap asks only for the ruleset-free clause of REQ-309h, but a
second normative surface grants parser access without a ruleset qualifier:
REQ-366b says "The observer SHALL have read-only access to world-model
inspection tools — `run_command (action: resolve)` (REQ-323), parser `look` and
`examine` commands, and resource reads …" (`spec/02-requirements.md:3760`).
Today the parser gate refuses the observer for **every** verb on **both** Novel
types, because the ruleset-bound branch calls `requireGM()` and the ruleset-free
branch calls `requireNotObserver()` (`holonovel/src/index.ts:4966-4976`). One
read-only predicate closes F-5.10-2 and REQ-366b's **parser** clause at once,
and the user chose this scope over the literal ruleset-free-only reading.

**Alternatives considered.** (a) Ruleset-free only, as the roadmap words it —
rejected by the user: it leaves REQ-366b's parser clause unimplemented and
produces the odd contract that a Player may `look` on a ruleset-bound Novel
while an observer may not. (b) Keep the observer GM-gated and instead weaken
REQ-366b — rejected: REQ-305 (`spec/02-requirements.md:1270`) already defines
observer mode as state-query-succeeds / mutation-refused, and weakening it to
satisfy an implementation shortcut is a larger normative change than the
defect. (c) One uniform read-only predicate, asserted on both Novel types —
chosen.

**Scope boundary inside REQ-366b.** REQ-366b also names
`run_command (action: resolve)` and the world-model resources. Those paths have
their own observer refusals — `visibility`/`audibility` at
`holonovel/src/index.ts:4787` and `resolve` at `:4814-4819`, both
`requireNotObserver()` — and this increment does **not** touch them. The
register entry therefore resolves the parser clause only, and the remainder is
scheduled: a new `## §5.12 observer resolve and resource reads (P1)` roadmap
section plus a `Scheduled-roadmap` register row. T643's REQ column stays
`REQ-309, REQ-196a`; adding REQ-366b there would claim coverage of clauses no
harness in this increment exercises.

**Second defect in the same clause family: REQ-309b says "sole exception".**
REQ-309b (`spec/02-requirements.md:3415`) states that on a ruleset-bound Novel
the read-only perception commands of REQ-309h "are the sole exception" to the
GM-only verb rule. Admitting the observer creates a second exception, so the
body is corrected in the same increment — the same standard this plan applies
to REQ-196a. Draft (795 characters newline-inclusive, 4 sentences, within the
800 limit):

```text
On ruleset-bound Novels, parser `command` and its navigation and mutating verb
names are Game Master only — the Player badge SHALL never see those verb names
in help, `run_command (action: suggest)`, or any tool output; the read-only
perception commands of REQ-309h (and the observer's read-only commands,
REQ-366b) are the sole exception. The AI narrator resolves player spatial
intent through `run_command (action: resolve)` (REQ-323); under the Player
badge, `run_command (action: suggest)` SHALL map spatial intents to that
action, never `command`. In ruleset-free mode (B1=`none`), the parser is the
primary Player surface (REQ-218) — the Player badge MAY call `command` and see
parser verbs. At `visible` (default): World-model and narrative tools SHALL
appear in primary help categories.
```

**Third defect in the same code path: the description-mode verbs write the
Novel before the gate.** `brief`/`verbose`/`normal` return at
`holonovel/src/index.ts:4937-4939`, above the badge gate, and each calls
`state.saveNovel(novel)`; `saveNovel` stamps `novel.metadata.modified =
new Date().toISOString()` (`holonovel/src/core/state.ts:2543`). An observer that
issues `brief` therefore mutates persisted Novel metadata today. REQ-197c makes
the mode session-scoped ("The mode persists for the session — the session
discards it on connection close", `spec/02-requirements.md:3339`) and
`roomDescriptionMode` is a module-level variable (`index.ts:1952-1961`), so the
write is redundant. **Repair:** drop the three `state.saveNovel(novel)` calls.
The verbs stay callable under every badge, and T240's Player-badge `brief`
assertions (`holonovel/scripts/test-output-contracts.ts:1442-1490`) keep
passing because the module-level mode variable is untouched.

**Decision recorded, no code change: `help` under the observer.** The help
branch (`holonovel/src/index.ts:4940-4948`) returns before the badge gate and
refuses only the `player`. An observer on a ruleset-bound Novel therefore sees
the full verb catalogue while a Player does not. This is pre-existing and is
kept deliberately: REQ-305 defines observer mode as carrying GM-level state
visibility ("The state surface is unfiltered (GM-level visibility)",
`spec/02-requirements.md:1270`), so catalogue disclosure to the observer is
consistent, while the Player refusal REQ-309b requires is preserved. The plan
records the asymmetry in `aar.md` rather than changing the help contract.

**Fourth surface: the tool description understates the badge rule.** The
`run_command` description says "while the Player badge keeps read-only
perception commands" (`holonovel/src/index.ts:4775`). It gains "the Player and
Observer badges keep read-only perception commands"; that is the only
tool-description edit. The description is 899 bytes today against a 1000B
budget, and the edit moves `tools_list_bytes`, so
`npm run surface-budget --write` is an unconditional step, not a conditional
one.

**Out of scope, unchanged: REQ-309h's body.** It already states the observer
clause correctly (`spec/02-requirements.md:3433`); this increment implements it.
Its `_Check:_ T353, T643` citation stays valid because both rows are widened
below.

**Out of scope, scheduled P2: holosuite anchor repoints.** Editing
`holonovel/src/index.ts` above line 5352 shifts every anchor below it. The
anchor corpus is already stale — of the 21 `anchor("holonovel/src/index.ts", …)`
records in `holonovel/scripts/lib/holosuite-*.ts`, only the two entries before
the edit point (`:12`, `:175`) resolve today; `:5352` is `recordVehicleMoment`,
not `create_room`, and `:9945` is claimed by three different symbols. Manual
repointing is therefore not a bounded task and is owned by the open P2 section
"Holosuite anchor repoint automation" (`ROADMAP.md:280-293`). This increment
records the unresolved set before and after the edit and requires the delta to
be empty; it does not repoint.

**Done bar** (each item names its command or artifact)

1. `holonovel/src/index.ts:4961-4978` carries one read-only predicate: the
   `observer` badge is read-only on every Novel, and a ruleset-bound `player`
   keeps its existing verb-scoped read-only window. Both share
   `PLAYER_READONLY_VERBS` (`:355`); a non-perception verb returns
   `[ERROR] [FORBIDDEN]` whose text names the accepted read-only commands, with
   the standard `Corrective action:` line from `err()`
   (`holonovel/src/index.ts:2857-2862`). `worldSnapshot()` runs only when the
   badge is not read-only, and `allowedVerbs` (`:5072`) follows the same
   predicate. The ruleset-free `requireNotObserver()` branch is deleted. All
   six badge×ruleset cells are preserved: observer read-only on both Novel
   types, ruleset-bound Player verb-scoped, ruleset-free Player unrestricted,
   GM unrestricted on both Novel types.

2. `holonovel/src/index.ts:4937-4939` no longer calls `state.saveNovel(novel)`;
   a `brief`/`verbose`/`normal` command changes session presentation only
   (REQ-197c). The count of `state.saveNovel(novel)` calls in the file is 193
   before the edit and 190 after.

3. `holonovel/src/index.ts:4775` names both the Player and Observer read-only
   windows. `npm run check-tool-definitions-sync` reports no drift after the
   regeneration documented in §4; `npm run tool-definitions-lint` stays at
   `0 violations`; `npm run surface-budget --write` re-records
   `spec/audit/tool-surface-baseline.json` and the fresh check passes.

4. `spec/02-requirements.md:3243` (REQ-196a body) accepts the observer badge on
   a ruleset-free Novel. One paragraph, ≤800 characters, ≤8 sentences (draft:
   754 characters newline-inclusive, 4 sentences), ending `_Check:_ T239,
   T643.` The draft, exactly as it should ship (one physical line; wrapped
   here):

   ```text
   THE parser command system SHALL accept natural-language text and resolve it
   against the world model's current state; the `command` tool resolves player
   spatial intent for the AI narrator. On a ruleset-bound Novel navigation and
   mutation SHALL be Game Master only: a Player-badge call for either returns
   `[ERROR] [FORBIDDEN]`, while the read-only commands of REQ-309h (`look`,
   `examine`/`search`, `inventory`) SHALL succeed. On a ruleset-free Novel the
   parser SHALL accept the `player`, `game_master`, and `observer` badges; the
   observer is read-only. *Acceptance criterion:* a ruleset-bound Player
   resolves `look` and is refused `go north`; a ruleset-free Player resolves
   both; an observer resolves `look` and is refused `go north`. _Check:_ T239,
   T643.
   ```

5. `spec/02-requirements.md:3415` (REQ-309b body) replaces "sole exception"
   with the observer-qualified clause pinned in §1. One paragraph, ≤800
   characters (draft: 795 newline-inclusive), same sentence count (4). No other
   clause of REQ-309b changes meaning.

6. `spec/appendices-reference.md:1779` (T353 row) gains one clause: "On the same
   ruleset-free Novel, the `observer` badge resolves
   `run_command (action: execute, "look")` and `inventory`, while `go north` and
   `take <thing>` return `[FORBIDDEN]`." Its REQ column stays `REQ-309`
   (REQ-309h already cites T353). `spec/appendices-reference.md:2061` (T643
   row) gains: "Under the `observer` badge, `look` and `i` succeed and
   `go north` returns `[FORBIDDEN]`." Its REQ column is unchanged
   (`REQ-309, REQ-196a`).

7. `holonovel/scripts/test-backfill.ts` adds one case after the T259
   ruleset-free case (`:1264-1274`), titled so it carries the `T353` token,
   inside the same `bf5` Novel: create a
   portable thing, switch to `observer`, assert `look` names the room,
   `inventory` is not refused, and `go north` plus `take <thing>` are
   `[FORBIDDEN]`; switch back to `game_master`. The harness reports
   `105 passed, 0 failed`.

8. `holonovel/scripts/test-competitive-gaps.ts:493-506` adds an `observer`
   window to the existing T643 case (ruleset-bound `Bay` Novel): `look`
   contains the room description, `i` succeeds, `go north` is `[FORBIDDEN]`,
   badge restored at the existing reset (`:506`); the suite stays
   `30 passed, 0 failed` because the case count does not change.

9. `spec/audit/review-register.md` moves `F-5.10-2` from `## Scheduled-roadmap`
   (`:1684-1692`) into a dated group at the top of `## Resolved`, citing the new
   predicate, the T353/T643 bindings, REQ-309h, REQ-196a, and REQ-366b's parser
   clause, and naming the resolve/resource clauses as scheduled. It adds
   `F-5.12-1 — REQ-366b resolve and resource reads still observer-refused` to
   `## Scheduled-roadmap`, naming the new roadmap section;
   `npm run check-registers:strict` passes.

10. `ROADMAP.md` deletes the closed section (`:15-24`) and adds
    `## §5.12 observer resolve and resource reads (P1)` in the same slot, with
    the two predicates (`holonovel/src/index.ts:4787`, `:4814-4819`) and a
    `**Trigger:**` line; `npm run check-roadmap` passes.

11. `spec/audit/req-coverage.md` is refreshed by
    `npm run validate -- --write-register`; REQ-196a carries T239/T643, and
    REQ-309b's row re-resolves against the edited citations; the coverage
    freshness check inside `npm run validate` passes.

12. `CHANGELOG.md` gains a new first entry
    `## 2026-11-11 — §5.10 observer badge parser access` naming REQ-309h,
    REQ-366b, REQ-196a, REQ-309b, T353, T643, the description-mode write
    removal, and the closed roadmap section.

13. `npm run assemble && npm run check:fast` exit 0 un-piped with the trailing
    `check:fast: PASS` line; `npm run validate:sdd` reports 0 errors.

14. The increment directory holds `plan.md`, `tasks.md`, `aar.md`, and
    `independent-review.md`; `aar.md` records the Phase 0 baseline and the
    `saveNovel` count, the Phase 1 probe output for both Novel types plus the
    description-mode write, the help-branch decision, the anchor unresolved-set
    comparison, `deployed: not applicable — no publication in scope`, and ends
    `LOOP PAUSED`; `npm run check-loop-artifacts` passes.

15. The increment lands as one commit via `npm run session:close` and
    `git status --porcelain` is empty afterwards.

## 2. Evidence (repo, verified this session)

- `ROADMAP.md:15-24` — the section: implement REQ-309h's `observer` clause on a
  ruleset-free Novel, replacing `requireNotObserver()`; closes when a
  ruleset-free `observer` call resolves `look` and `inventory` and F-5.10-2 is
  `Resolved`.
- `spec/02-requirements.md:3433` — REQ-309h: ruleset-free Novels accept the
  `player`, `game_master`, and `observer` badges (observer read-only);
  `_Check:_ T353, T643`. No body edit needed.
- `spec/02-requirements.md:3760` — REQ-366b grants the observer read-only access
  to parser `look`/`examine`, `run_command (action: resolve)`, and
  `room://`/`thing://`/`world://map` reads. Only the parser clause is in scope.
- `spec/02-requirements.md:3415` — REQ-309b, 789 characters today; its "sole
  exception" sentence becomes false once the observer is admitted. Corrected.
- `spec/02-requirements.md:1270` — REQ-305: observer mode is read-only; state
  query succeeds, mutation is `[FORBIDDEN]`, and the state surface is
  unfiltered (GM-level visibility). This is the predicate for the `help`
  decision.
- `spec/02-requirements.md:3339` — REQ-197c: the description mode is
  session-scoped and `spec_health` reports it; nothing about the Novel record
  depends on the save.
- `spec/02-requirements.md:3243` — REQ-196a currently accepts only the `player`
  and `game_master` badges on a ruleset-free Novel; corrected in this increment.
- `holonovel/src/index.ts:4961-4976` — the gate: `playerReadOnly` for a
  ruleset-bound Player, `requireGM()` for every other badge on a ruleset-bound
  Novel, `requireNotObserver()` on a ruleset-free Novel.
- `holonovel/src/index.ts:355` — `PLAYER_READONLY_VERBS` =
  `look, examine, x, search, inventory, i`.
- `holonovel/src/index.ts:4977-4978` — the snapshot is skipped only for the
  Player read-only window; `worldSnapshot()` delegates to `novelSnapshot()`
  (`:3233-3235`).
- `holonovel/src/index.ts:5072` — `allowedVerbs: playerReadOnly ? READONLY_VERBS
  : undefined` feeds the nearest-verb hint filter.
- `holonovel/src/index.ts:4937-4939` — description-mode verbs precede the gate
  and call `state.saveNovel(novel)`; `holonovel/src/core/state.ts:2543` shows
  `saveNovel` stamps `metadata.modified`. The file holds 193
  `state.saveNovel(novel)` calls today (measured this session).
- `holonovel/src/index.ts:1952-1961` — `roomDescriptionMode` is module-level and
  session-scoped.
- `holonovel/src/index.ts:4940-4948` — the help branch refuses only `player`;
  observer catalogue disclosure is the recorded decision.
- `holonovel/src/index.ts:4787` and `:4814-4819` — `visibility`/`audibility` and
  `resolve` call `requireNotObserver()`; these are the REQ-366b clauses left
  scheduled.
- `holonovel/src/index.ts:2857-2862` — `err()` appends the
  `Corrective action:` line; `FORBIDDEN` maps to the `set_badge` guidance
  (`:2851`).
- `holonovel/src/core/state.ts:1124-1126` — `requireNotObserver()` throws
  `[FORBIDDEN] Observer mode is read-only.` This is the F-5.10-2 predicate and
  the message the prior Phase 1 probe recorded for `look` and `xyzzy`
  (`docs/plans/2026-11-11-5-10-req-196a-player-badge-clause/aar.md:119`).
- `holonovel/src/index.ts:4775` — the `run_command` description's badge clause;
  the generated artifact is `holonovel/tool-definitions.json:2264` with an
  899-byte description (measured this session).
- `scripts/surface-budget.ts:26` — the budget baseline is
  `spec/audit/tool-surface-baseline.json`; `surface_footprint` lives in
  `holonovel/tool-definitions.json`. The description edit moves
  `tools_list_bytes`, so `--write` is required.
- `spec/appendices-reference.md:1779` — T353 row: prominence, ruleset-free
  build, suggest mapping. Widened here.
- `spec/appendices-reference.md:2061` — T643 row: ruleset-bound Player `look`
  and `i` succeed, `go north` returns `[FORBIDDEN]`, `xyzzy` refused with no
  valid-command list. Widened here.
- `holonovel/scripts/test-backfill.ts:1135` — `bf5` is created with
  `manage_novel (action: create)` and no ruleset bind, so it is ruleset-free;
  T259 (`:1264-1274`) creates `rf-room` and `character_01` and asserts a Player
  `look` that names the room.
- `holonovel/scripts/test-competitive-gaps.ts:483-506` — the T643 setup: seed
  package `percept`, `manage_ruleset (action: bind)`, room `Bay`, character
  `Scout`, Player window, `xyzzy` at `:503`, badge reset at `:506`.
- `holonovel/scripts/test-output-contracts.ts:1442-1490` — T240 exercises
  `brief`/`normal` under the Game Master and Player badges on a ruleset-free
  Novel and asserts `health.description_mode`; the guard for the `saveNovel`
  removal.
- `holonovel/scripts/lib/holosuite-adversarial.ts:29-37`,
  `holosuite-conformance.ts:35-37,170,192`, `holosuite-invariants.ts:29,32,82,85`,
  `holosuite-novel.ts:31-36` — the 21 `index.ts` anchors. Verified this session:
  only `:12` and `:175` currently resolve; everything at or above `:5352` is
  already stale, so the edit adds no resolvable-anchor regression.
- `scripts/lib/loop-artifacts.ts:60-88` — an increment directory without
  `plan.md`, `tasks.md`, and `aar.md` fails `check-loop-artifacts`; the Phase 0
  skeleton therefore ships all three with a `LOOP OPEN` terminal token.
- `scripts/lib/gate-manifest.ts` — `check-registers`, `check-roadmap`,
  `check-tool-definitions-sync`, `tool-definitions-lint`, `surface-budget`, and
  `check-loop-artifacts` all run in `check:fast`.
- `scripts/lib/contract-fingerprint.ts` — the fingerprinted sections are §5.16,
  §5.17, §6.3, §6.4.2 and the data-format set; §5.10, Appendix F, and
  `index.ts` are not fingerprinted.
- Baseline this session: `npm run check:fast` → 40 passed, 0 failed,
  `check:fast: PASS`; `npm --prefix holonovel run test:backfill` → 104 passed;
  `test:competitive-gaps` → 30 passed; `test:output-contracts` → 390 passed;
  `npm run status` → 51 unpushed commits, 16 open roadmap items;
  `git status --porcelain` empty.

## 3. Blast radius

Sizes: S = a few lines; M = a section; gen = written by a tool.

| Path | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | one read-only predicate (`:4961-4978`); `saveNovel` dropped from the three description-mode branches (`:4937-4939`); `run_command` description badge clause (`:4775`) | S |
| `holonovel/tool-definitions.json` | regenerated by `holonovel/scripts/generate-tool-definitions.ts` | gen |
| `spec/audit/tool-surface-baseline.json` | rewritten by `npm run surface-budget --write` (the description edit moves `tools_list_bytes`) | gen |
| `holonovel/scripts/test-backfill.ts` | new T353 observer case | S |
| `holonovel/scripts/test-competitive-gaps.ts` | T643 observer window | S |
| `spec/02-requirements.md` | REQ-196a body (observer admitted); REQ-309b body (observer exception) | S |
| `spec/appendices-reference.md` | T353 and T643 rows widened | S |
| `spec/audit/review-register.md` | `F-5.10-2` moved to `## Resolved`; `F-5.12-1` added to `## Scheduled-roadmap` | S |
| `spec/audit/req-coverage.md` | regenerated by `npm run validate -- --write-register` | gen |
| `ROADMAP.md` | closed section deleted; §5.12 observer resolve/read section added | S |
| `CHANGELOG.md` | new dated first entry | S |
| `docs/plans/2026-11-11-5-10-observer-badge-parser-access/` | `plan.md`, `tasks.md`, `aar.md`, `independent-review.md` | S |
| `holonovel.md`, `holonovel/holonovel.md` | generated by `npm run assemble` (not hand-edited) | gen |
| `spec/build-phase-map.md` | content-hash line rewritten by `npm run assemble` (REQ-278) | gen |

No new tool, resource, or prompt: no `check-tool-surface`, `surface-replay`, or
gate-manifest change. No data, schema, credential, network, or publication step
in scope. No anchor repoint (see §1).

## 4. Steps (dependency order)

**Phase 0 — baseline and predicate confirmation.** The increment directory
already carries `plan.md`, `tasks.md`, and an `aar.md` skeleton with the
baseline measured this session (check:fast 40/40; backfill 104/104;
competitive-gaps 30/30; output-contracts 390/390) and the `saveNovel` baseline
(193). Re-grep the edited locations (`index.ts:4937-4939`, `:4961-4978`,
`:4775`, `:4787`, `:4814-4819`; `spec/02-requirements.md:3243`, `:3339`,
`:3415`, `:3433`, `:3760`; `appendices-reference.md:1779`, `:2061`) to confirm
line numbers, and record that `F-5.10-2` is the only `Scheduled-roadmap` row
for this section.

**Phase 1 — probe the shipped refusal on both Novel types (trust boundary:
tool-output).** Write a throwaway tsx probe under `/tmp/opencode` (not
committed; its body and output are copied into `aar.md`). It boots the engine
three times:
1. Ruleset-free: create a Novel, `manage_world (action: convert)` with the
   Appendix K fixture, create and activate a character, `set_badge observer`,
   then call `run_command` for `look`, `inventory`, `go north`, and `take item`.
   Record every result (expected `[FORBIDDEN] Observer mode is read-only.` for
   all four — the F-5.10-2 predicate).
2. Ruleset-bound: seed a package, `manage_ruleset (action: bind)`, create a room
   and character (`test-competitive-gaps.ts:483-492` shows the recipe),
   `set_badge observer`, call the same four commands, then
   `run_command { action: "resolve", intent: "look" }` and
   `run_command { action: "visibility", ... }`. Record the parser refusals
   (expected) and the resolve/visibility refusals (expected; these are the
   scheduled F-5.12-1 predicates).
3. Description mode: under `observer`, call `run_command { command: "brief" }`
   and stat the Novel file's `metadata.modified` before and after (expected to
   change today; the pre-gate write defect).
Stop and report if any expected parser refusal is already a success: the
predicate changed, and this plan's code step is unnecessary. The probe, not the
plan, is authoritative.

**Phase 2 — implement the read-only predicate.**
1. Replace `holonovel/src/index.ts:4961-4978` with one predicate:
   `observerReadOnly = executeBadge === "observer"`, `playerReadOnly =
   novel.ruleset && executeBadge === "player"`, `readOnlyBadge = playerReadOnly
   || observerReadOnly`; the refusal text branches on `observerReadOnly`, both
   naming the read-only verbs; `else if (novel.ruleset) requireGM()`; the
   ruleset-free `requireNotObserver()` branch is deleted; `if (!readOnlyBadge)
   worldSnapshot()`; `allowedVerbs: readOnlyBadge ? READONLY_VERBS : undefined`
   at `:5072`. Update the two comments to state the observer contract
   (REQ-305, REQ-366b) beside the Player one (REQ-309h).
2. Delete the three `state.saveNovel(novel)` calls at `:4937-4939`; leave the
   module-variable assignment.
3. Edit the `run_command` description at `:4775` to "the Player and Observer
   badges keep read-only perception commands".
4. Regenerate the tool definitions (`npx tsx
   holonovel/scripts/generate-tool-definitions.ts`), then run
   `npm run check-tool-definitions-sync`, `npm run tool-definitions-lint`, and
   **unconditionally** `npm run surface-budget --write` (the description edit
   moves the recorded footprint).

**Phase 3 — exercise both branches.**
1. `holonovel/scripts/test-backfill.ts`: add the observer case after T259
   (`:1264-1274`) per done bar 7. Use the existing `assertContains`/
   `assertNotContains` helpers (`:29-35`); create the portable thing with
   `manage_world (action: create_thing)` before switching badges so the `take`
   refusal is not a not-found result.
2. `holonovel/scripts/test-competitive-gaps.ts:493-506`: insert the observer
   window before the badge reset, asserting `look`, `i`, and the `go north`
   refusal, per done bar 8.

**Phase 4 — align the normative and catalogue surfaces.**
1. `spec/02-requirements.md:3243`: replace the body with the draft pinned in
   done bar 4 (one physical line, no table, bullet, or step list).
2. `spec/02-requirements.md:3415`: replace the body with the REQ-309b draft
   pinned in §1; keep one physical line.
3. `spec/appendices-reference.md:1779` and `:2061`: append the clauses in done
   bar 6; leave both REQ columns unchanged.
4. `spec/audit/review-register.md`: move `F-5.10-2` into a dated `###` group at
   the top of `## Resolved`, renamed to cover both clauses, citing the edited
   predicate, REQ-309h, REQ-366b's parser clause, REQ-196a, T353, and T643; add
   `F-5.12-1` to `## Scheduled-roadmap`.
5. `ROADMAP.md`: delete the section at `:15-24`; add
   `## §5.12 observer resolve and resource reads (P1)` in the same slot.

**Phase 5 — bookkeeping and generation.** Add the CHANGELOG entry; regenerate
the coverage register (`npm run validate -- --write-register`); run
`npm run assemble`; complete `tasks.md` and `aar.md` (anchor unresolved-set
comparison, help-branch decision, both AGENTS.md regeneration notes).

**Phase 6 — verify.** Run every check in §6 in order, then
`npm run session:close` for the single commit.

## 5. Edge cases and rollback

- **The Phase 1 probe shows `observer` `look` already succeeding.** Then
  F-5.10-2 is stale (a gate was removed since the prior increment). Record the
  output, drop the code step, and re-scope the increment to the REQ-366b
  ruleset-bound gap only — do not write a predicate for behaviour that already
  exists.
- **The observer is refused on one Novel type only.** The uniform decision
  assumes both branches refuse; if the probe shows otherwise, split the
  predicate per branch and record which clause each branch implements in
  `aar.md` before editing.
- **`brief` no longer advancing `metadata.modified` breaks an unintended
  consumer.** No test asserts the write; if one appears, restore the save only
  for non-observer badges rather than reverting the read-only contract.
- **The widened description breaches the 1000B budget.** Shorten the clause to
  "the Player/Observer badges keep read-only perception" or drop "keeps" — the
  badge disclosure is the part that must stay.
- **`check-tool-definitions-sync` reports drift after the edit.** Regenerate
  from the TS source; never hand-edit `holonovel/tool-definitions.json`.
- **`surface-budget` reports a stale record after regeneration.** Run
  `npm run surface-budget --write` and include
  `spec/audit/tool-surface-baseline.json`; do not hand-edit the baseline.
- **The new backfill case errors on an empty inventory string.** `inventory`
  under a character with nothing carried is a success path; assert only that
  `[FORBIDDEN]` is absent, not that any item is named.
- **REQ-309b exceeds 800 characters.** Drop "under the Player badge," from the
  suggest sentence (about 26 characters) — the exception clause stays.
- **`check-markers` reports README drift.** Run `npm run refresh-properties`
  and include the regenerated markers in the same commit.
- **`check-fingerprint-sync` fails.** Unexpected: no fingerprinted section is
  edited. Run `npm run build-order` and record the diff rather than hand-editing
  the generated module.
- **The anchor unresolved set grows.** Run the /tmp checker over
  `holonovel/scripts/lib/holosuite-*.ts` with `resolvePredicate`
  (`holonovel/scripts/lib/eval-predicate.ts:80`) before and after the edit and
  compare; a new unresolved predicate from a line shift is a plan failure, not
  an invitation to repoint (that is the P2 automation item).
- **Rollback.** `git revert` of the single commit restores the gate, the three
  `saveNovel` calls, the description, both harness cases, REQ-196a, REQ-309b,
  both Appendix F rows, the register, the roadmap, and the changelog. No data,
  schema, or publication state is involved.
- **Publication is out of scope.** The plan stops at the local commit; a later
  explicit "push" runs `push-pipeline.sh` and writes the spec-update record.

## 6. Verification summary

| Check | Command | Expected |
|---|---|---|
| Parser catalogue harness | `npm --prefix holonovel run test:backfill` | 105 passed, 0 failed |
| Badge-gate harness | `npm --prefix holonovel run test:competitive-gaps` | 30 passed, 0 failed (T643 gains assertions, no new case) |
| Description-mode regression | `npm --prefix holonovel run test:output-contracts` | 390 passed, 0 failed |
| REQ-196a length | `sed -n 3243p spec/02-requirements.md \| wc -m` | ≤800 (draft: 754) |
| REQ-196a clause | `grep -c "On a ruleset-free Novel the parser SHALL accept the \`player\`, \`game_master\`, and \`observer\` badges" spec/02-requirements.md` | 1 |
| REQ-309b length | `sed -n 3415p spec/02-requirements.md \| wc -m` | ≤800 (draft: 795) |
| REQ-309b clause | `grep -c "the observer's read-only commands, REQ-366b" spec/02-requirements.md` | 1 |
| REQ-309h untouched | `grep -c "observer read-only" spec/02-requirements.md` | 1 |
| T353 row | `grep -c "On the same ruleset-free Novel, the \`observer\` badge resolves" spec/appendices-reference.md` | 1 |
| T643 row | `grep -ci "under the \`observer\` badge, \`look\` and \`i\` succeed" spec/appendices-reference.md` | 1 |
| Read-only predicate | `grep -c "observerReadOnly" holonovel/src/index.ts` | ≥2 |
| Description-mode write removed | `grep -c "state.saveNovel(novel)" holonovel/src/index.ts` | 190 (baseline 193) |
| Tool definitions | `npm run check-tool-definitions-sync` | pass |
| Description budget | `npm run tool-definitions-lint` | 0 violations, under budget |
| Surface footprint | `npm run surface-budget` (after `--write`) | pass |
| Assemble + gates | `npm run assemble && npm run check:fast` | `check:fast: PASS` |
| Strict validation | `npm run validate:sdd` | 0 errors |
| Coverage register freshness | `npm run validate` | 0 errors |
| Anchor delta | /tmp `resolvePredicate` comparison, before vs after | no new unresolved predicate |
| Roadmap admission | `npm run check-roadmap` | pass |
| Register hygiene | `npm run check-registers:strict` | pass |
| Increment artifacts | `npm run check-loop-artifacts` | pass |
| Commit | `npm run session:close` | one commit, clean tree |

Unverified by design: `test:all` full green — the holosuite tiers already fail
on the stale anchor corpus (the open P2 section owns the repoint). The
pre-change unresolved set is recorded in `aar.md` and compared after the edit
rather than claimed green. REQ-366b's resolve and resource-read clauses are
scheduled, not verified here.

## 7. Open questions

None. The scope decision (uniform versus ruleset-free-only) was put to the user
and answered: uniform, both Novel types, one increment. The REQ-366b remainder
is scheduled rather than absorbed. The description-mode write is repaired rather
than scheduled because it is a three-line redundant call in the same code path.
The observer `help` asymmetry is recorded as a deliberate decision grounded in
REQ-305's unfiltered state surface.
