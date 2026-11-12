# Plan — §5.12 observer resolve and resource reads

Status: draft · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-11-5-12-observer-resolve-resource-reads/`
Rollback cost: 1 (reversible code, spec, and harness edits; one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the first open `ROADMAP.md` section — **§5.12 observer resolve and
resource reads (P1)** (`ROADMAP.md:15-25`) — and close it. The section was
scheduled by the previous increment as `F-5.12-1`
(`spec/audit/review-register.md:1704-1712`).

**Decision 1 (code): `run_command (action: resolve)` and the spatial queries
admit the observer.** REQ-366b grants the observer read-only access to
"`run_command (action: resolve)` (REQ-323) … and resource reads"
(`spec/02-requirements.md:3760`), but both paths still refuse it:
`visibility`/`audibility` call `requireNotObserver()` at
`holonovel/src/index.ts:4787`, and `resolve` calls it at `:4819` after the
Player-only refusal at `:4816-4818`. A probe run this session against a
populated Novel returned `[FORBIDDEN] Observer mode is read-only.` for all
three actions. The fix is local: delete the two `requireNotObserver()` calls,
keep the Player-badge refusal on `resolve` and the Player point-of-view
restriction on the spatial queries (`:4792-4794`), and leave the observer
unrestricted in both (REQ-305's state-query permission).

**Decision 2 (finding correction): the resource reads are not refused today.**
The roadmap and register both assert that `room://`, `thing://`, and
`world://map` are "still refused by `requireNotObserver()`". That predicate is
false at this commit: no resource handler calls it, and the same probe read
all three successfully under the observer badge. The real defect is **depth
inconsistency**. `room://` and `thing://` compute
`isGM = badge === "game_master" || badge === "none"` (`index.ts:13448`,
`:13487`), so the observer falls into the Player rendering: no ids, no
`**Kind:**`/`**Properties:**`, no containment chain, no hazard annotations.
`world://map` and `world://kinds` instead use
`badge === "player" ? "player" : "game_master"` (`:13513`, `:13519`), so the
observer already reads at GM depth there. The increment makes the four
world-model resources agree: `room-single` and `thing-single` add `observer`
to the GM branch. This follows REQ-305a — "The state surface is unfiltered
(GM-level visibility)" (`spec/02-requirements.md:1270`) — and REQ-366b's
"consistent with the state-query permission of REQ-305".

**Alternatives considered for Decision 2.** (a) Leave `room://`/`thing://` at
Player depth and narrow REQ-366b to "access only" — rejected: it contradicts
REQ-305a and leaves two of four world-model resources rendered at a depth the
spec calls unfiltered. (b) Introduce a third observer tier that shows structure
but hides hazard `annotations`, on the reading that REQ-366a's exclusion of
"countdown tick positions" covers them — rejected: REQ-366a's exclusion list is
scoped to `badge_briefing`, and `world://map` already renders annotations to
the observer today, so a third tier would create a new inconsistency while
adding a rendering branch no REQ requires. (c) Include the observer in the GM
branch — chosen, minimal, and it makes the shipped behaviour self-consistent.

**Decision 3 (spec): REQ-366b gets its missing `_Check:` and one depth
sentence.** REQ-366b has no `_Check:` citation today (`:3760`), so
`F-5.12-1` names no assertion. It gains one closing sentence plus
`_Check:_ T417`. The body is 593 characters today; the draft below is 694,
inside the 800 limit and under the 8-sentence cap. No other clause changes.
Draft (one physical line; wrapped here):

```text
The observer SHALL NOT mutate state — the read-only contract of REQ-305
applies to all narrative tools. Synthesis content (REQ-159) SHALL render in
the observer `badge_briefing` under the same badge-filtering rules as the
Player badge: game_master-scoped synthesis items are hidden; shared-scope items
are visible. The observer SHALL have read-only access to world-model inspection
tools — `run_command (action: resolve)` (REQ-323), parser `look` and `examine`
commands, and resource reads (`room://<id>`, `thing://<id>`, `world://map`) —
consistent with the state-query permission of REQ-305. World-model resource
reads render at the observer's unfiltered state depth (REQ-305). _Check:_ T417.
```

**Third surface: the catalogue row the finding cites.** Appendix F's T417 row
(`spec/appendices-reference.md:1872`) covers the observer briefing only; it
gains the resolve/query/resource assertions. T643
(`spec/appendices-reference.md:2061`) already carries an observer window on a
ruleset-bound Novel; it gains the resolve and visibility assertions (so the
clause is asserted on both Novel types) and `REQ-366b` in its REQ column.

**Out of scope.** The parser `look`/`examine` clause of REQ-366b shipped in the
previous increment. No tool, parameter, description, or resource *definition*
changes: `room://`, `thing://`, `world://map` already exist in the resource
catalogue (`index.ts:12457-12459`), so there is no `check-tool-surface`,
`surface-budget`, or tool-definitions regeneration step. No new gate.

**Done bar** (each item names its command or artifact)

1. `holonovel/src/index.ts:4787` no longer calls `requireNotObserver()`; the
   `visibility`/`audibility` branch keeps `requireNovel()`, the source
   resolution, and the Player point-of-view restriction (`:4792-4794`). An
   observer may name any `source`.
2. `holonovel/src/index.ts:4819` no longer calls `requireNotObserver()`; the
   Player refusal at `:4816-4818` is unchanged, so `resolve` stays unavailable
   to the Player badge and available to the GM and observer. Neither path
   snapshots or writes (verified: `resolveIntentWorld`
   `:6157-6159` reads only; the spatial branch returns before any mutation).
3. `holonovel/src/index.ts:13447-13448` and `:13486-13487` include `observer`
   in the GM branch, so `room://` shows ids, the `**Exits:**` targets, and
   `**Annotations:**`, and `thing://` shows `**Kind:**`, `**Location:**` with
   the containment chain, and `**Properties:**`. `world://map` and
   `world://kinds` are unchanged.
4. `spec/02-requirements.md:3760` (REQ-366b) gains the depth sentence and
   `_Check:_ T417`; the body is one paragraph, ≤800 characters (draft: 694),
   ≤8 sentences (draft: 4), with no table, bullet, or step list.
5. `spec/appendices-reference.md:1872` (T417 row) gains: "Assert
   `run_command (action: resolve, intent)` and `run_command (action: visibility
   | audibility)` succeed without `[FORBIDDEN]`, and `room://<id>`,
   `thing://<id>`, and `world://map` read at Game Master depth (thing ids,
   property values, containment chain); assert `manage_scene (action: set)`
   still returns `[FORBIDDEN]`." Its REQ column stays `REQ-366, REQ-305`.
6. `spec/appendices-reference.md:2061` (T643 row) gains: "On the same
   ruleset-bound Novel, an observer `run_command (action: resolve)` and
   `run_command (action: visibility, source: \"character_01\", target:
   \"Scout\")` succeed." Its REQ column becomes
   `REQ-309, REQ-196a, REQ-366b`.
7. `holonovel/scripts/test-narrative.ts:910-919` (the T417 case) creates a
   fixed, lit thing `lantern` in the fixture's `Throne Room`
   (`manage_world { action: "create_thing", name: "lantern", kind: "thing",
   location: "Throne Room", fixed: true, lit: true, switched_on: true }` —
   `fixed`, not `portable`, is the schema's take-prevention flag,
   `index.ts:5511`), then under `observer` asserts: `resolve` for `look` and
   `go north` returns a JSON status and no `[FORBIDDEN]`; with
   `source: "character_01"` the query without a target lists `lantern` and the
   query with `target: "lantern"` returns `can_see` (a room name is not a valid
   target — `resolveSpatialThing` resolves things only and returns nothing for a
   room, `index.ts:4764-4771`, so `run_command` raises `[NOT_FOUND]` at
   `:4804`); `audibility` with
   `target: "lantern"` returns `can_hear`; `room://Throne%20Room` names the
   thing with its id (room keys are the lowercased name including the space,
   `index.ts:5614`, so the URI percent-encodes it; `room://throne_room` returns
   `not found`) and `thing://lantern` carries `**Properties:**`; `world://map`
   names both rooms; `manage_scene (action: set)` is still `[FORBIDDEN]`; badge
   restored to `game_master`. The suite reports 75 passed, 0 failed with no new
   case (`test()` count unchanged).
8. `holonovel/scripts/test-competitive-gaps.ts:509-518` (T643's observer
   window) adds `run_command { action: "resolve", intent: "look" }` and
   `run_command { action: "visibility", source: "character_01", target:
   "Scout" }`, asserting each returns its JSON field (`status`, `can_see`) and
   no `[FORBIDDEN]`; the suite stays 30 passed, 0 failed. The fixture has no
   thing, so the visibility target is the active entity, which
   `resolveSpatialActor` resolves by name (`index.ts:4755-4761`); the assertion
   is on the field's presence (`can_see`), not on its value, so it does not
   depend on whether `Bay` is lit.
9. `spec/audit/review-register.md` moves `F-5.12-1` from
   `## Scheduled-roadmap` (`:1702-1712`) into a dated `###` group at the top of
   `## Resolved`, restating the predicate correctly: resolve and the spatial
   queries were observer-refused (`index.ts:4787`, `:4819`); the resources were
   never refused, they rendered at Player depth for `room://`/`thing://` while
   `world://map` rendered at GM depth (`:13448`, `:13487` vs `:13513`).
   `npm run check-registers:strict` passes.
10. `ROADMAP.md` deletes the closed section (`:15-25`); the next item becomes
    `## §5.10 parser tool-name drift (P2)` at the top of the file.
    `npm run check-roadmap` passes.
11. `spec/audit/req-coverage.md` is refreshed by
    `npm run validate -- --write-register`; REQ-366's row resolves against
    T417 and the freshness check inside `npm run validate` passes.
12. `CHANGELOG.md` gains a first entry
    `## 2026-11-11 — §5.12 observer resolve and resource reads` naming
    REQ-366b, REQ-305, T417, T643, the corrected register predicate, and the
    closed roadmap section.
13. `npm run assemble && npm run check:fast` exit 0 un-piped with the trailing
    `check:fast: PASS` line; `npm run validate:sdd` reports 0 errors.
14. The increment directory holds `plan.md`, `tasks.md`, `aar.md`, and
    `independent-review.md`; `aar.md` records the Phase 0 baseline, the Phase 1
    probe transcript for every surface, the annotation-depth decision, the
    anchor unresolved-set comparison, `deployed: not applicable — no
    publication in scope`, and ends `LOOP PAUSED`;
    `npm run check-loop-artifacts` passes.
15. The increment lands as one commit via `npm run session:close` and
    `git status --porcelain` is empty afterwards.

## 2. Evidence (repo, verified this session)

- `ROADMAP.md:15-25` — the section: accept the observer badge on `resolve`,
  `visibility`/`audibility`, and the world-model reads "still refused by
  `requireNotObserver()`"; widen the Appendix F row it cites; closes when each
  path resolves and F-5.12-1 is `Resolved`.
- `spec/audit/review-register.md:1704-1712` — F-5.12-1, the Scheduled-roadmap
  row this increment resolves; its resource-reads premise is corrected in
  done bar 9.
- `spec/02-requirements.md:3760` — REQ-366b: observer read-only access to
  `run_command (action: resolve)`, parser `look`/`examine`, and `room://<id>`,
  `thing://<id>`, `world://map`, "consistent with the state-query permission of
  REQ-305". No `_Check:` today; 593 characters.
- `spec/02-requirements.md:1270` — REQ-305a: "Tool gating (REQ-032) restricts
  the human to read-only access: state-query tools succeed; all mutating tools
  return `[FORBIDDEN]` … The state surface is unfiltered (GM-level
  visibility)."
- `spec/02-requirements.md:3399` — REQ-202a: `room://` holds name,
  description, visible things, exits, and hazard `annotations`; `thing://`
  holds name, description, location, properties; `world://map` holds the room
  graph.
- `spec/02-requirements.md:3402` — REQ-202b: all world-model resources are
  badge-filtered; Player sees descriptions and visible state; GM sees metadata
  including property values and containment chains. It does not name the
  observer, which is why REQ-366b carries the depth statement.
- `spec/02-requirements.md:3487-3491` — REQ-596/REQ-597: the spatial queries are
  read-only, take no snapshot, and restrict the Player badge to the active
  entity's point of view; neither names a GM requirement.
- `holonovel/src/index.ts:4786-4787` — `requireNotObserver()` at the top of the
  `visibility`/`audibility` branch. Predicate for F-5.12-1 (first half).
- `holonovel/src/index.ts:4792-4794` — the Player point-of-view restriction
  that stays.
- `holonovel/src/index.ts:4814-4822` — the `resolve` branch: Player refusal at
  `:4816-4818`, `requireNotObserver()` at `:4819`, then
  `resolveIntentWorld()`. Predicate for F-5.12-1 (second half).
- `holonovel/src/index.ts:6157-6159` — `resolveIntentWorld` reads `novel.world`
  and returns a record; no `state.saveNovel`, no snapshot, no audit.
- `holonovel/src/index.ts:13447-13448` — `room-single`: `isGM = badge ===
  "game_master" || badge === "none"`; the observer therefore takes the Player
  branch (`:13451-13472`).
- `holonovel/src/index.ts:13486-13487` — `thing-single`: same `isGM` predicate;
  the GM branch renders `**Kind:**`, `**Location:**` with `containmentChain`,
  and `**Properties:**` (`:13489-13503`).
- `holonovel/src/index.ts:13510-13522` — `world://map` and `world://kinds`:
  `badge === "player" ? "player" : "game_master"`, so the observer already
  reads at GM depth; `worldMap` renders the `## Annotations` section only for
  `game_master` (`holonovel/src/world/model.ts:1053-1067`).
- `holonovel/src/index.ts:12457-12459` — the three URIs are already registered
  in the world-model resource catalogue; no resource addition.
- `spec/appendices-reference.md:1872` — T417 row (REQ-366, REQ-305): briefing
  composition, `[not present]`, `knowledge_state`, GM-only exclusions,
  `manage_scene (action: set)` refusal.
- `spec/appendices-reference.md:2061` — T643 row (REQ-309, REQ-196a): Player and
  observer parser window on a ruleset-bound Novel.
- `holonovel/scripts/test-narrative.ts:910-919` — the T417 case; the enclosing
  block (`:829-880`) creates `Throne Room`/`Anteroom` with a `north` exit and
  `character_01` (`SpatialChar`), so the observer surface has rooms and an
  active entity. `readResource` is already imported (`:9`, `:105`).
- `holonovel/scripts/test-competitive-gaps.ts:483-519` — the T643 setup
  (`percept` package, `Bay` room, `Scout` character) and its observer window
  (`:509-518`).
- `scripts/lib/gate-manifest.ts` — `check-registers`, `check-roadmap`,
  `check-loop-artifacts`, `validate`, `typecheck`, and the harness self-tests
  all run in `check:fast`.
- `scripts/lib/contract-fingerprint.ts` — §5.12, Appendix F, and `index.ts`
  are not fingerprinted; no fingerprint regeneration is implied.
- Third probe this session (resource URI form): a `Throne Room` with `lantern`
  returned GM-depth content for `room://Throne%20Room` (`**You can see:**
  lantern (lantern, thing)`) and `thing://lantern` (`**Kind:**`,
  `**Location:** … (lantern → Throne Room)`, `**Properties:** …`), while
  `room://throne_room` and `room://anteroom` returned `{"error":"not found"}`.
  Room keys are `args.name.toLowerCase()` (`index.ts:5614`), so a multi-word
  room URI must percent-encode its space.
- Baseline this session: `npm run check:fast` → 40 passed, 0 failed,
  `check:fast: PASS`; `npm --prefix holonovel run test:narrative` → 75 passed,
  0 failed; `test:competitive-gaps` → 30 passed, 0 failed (measured after this
  plan's probe); `npm run status` → 52 unpushed commits, 16 open roadmap
  items; `git status --porcelain` empty.
- Probe this session (throwaway tsx under `/tmp/opencode`, transcript copied to
  `aar.md`): a fresh Novel with room `Vault`, thing `lantern`, active entity
  `character_01`, then `set_badge observer` returned
  `[FORBIDDEN] Observer mode is read-only.` for `resolve`, `visibility`, and
  `audibility`; the same three resource reads returned content —
  `room://vault` without the thing's id or annotations, `thing://lantern`
  without `**Properties:**`, `world://map` as the full adjacency list.
- Second probe this session (resolution shape, Game Master badge): a
  `Throne Room`/`Anteroom` world with a `north` exit, a fixed lit `lantern`, and
  `character_01` returned `{"source":"character_01","room":"Throne Room",
  "visible":["lantern"]}` for a targetless `visibility`, `{"can_see":true}` for
  `target: "lantern"`, `{"can_hear":true}` for `audibility`, and
  `[NOT_FOUND] Target 'Throne Room' not found.` for a room as target. The
  entity carries `current_room`, so an explicit `source` resolves after
  `manage_character (action: create)` without a movement step.

## 3. Blast radius

Sizes: S = a few lines; M = a section; gen = written by a tool.

| Path | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | two `requireNotObserver()` calls removed (`:4787`, `:4819`); `room-single`/`thing-single` GM branch admits `observer` (`:13448`, `:13487`) | S |
| `holonovel/scripts/test-narrative.ts` | T417 case gains the resolve/query/resource assertions | S |
| `holonovel/scripts/test-competitive-gaps.ts` | T643 observer window gains resolve + visibility | S |
| `spec/02-requirements.md` | REQ-366b depth sentence + `_Check:_ T417` | S |
| `spec/appendices-reference.md` | T417 and T643 rows widened; T643 REQ column extended | S |
| `spec/audit/review-register.md` | F-5.12-1 moved to `## Resolved` with the corrected predicate | S |
| `spec/audit/req-coverage.md` | regenerated by `npm run validate -- --write-register` | gen |
| `ROADMAP.md` | closed section deleted | S |
| `CHANGELOG.md` | new dated first entry | S |
| `docs/plans/2026-11-11-5-12-observer-resolve-resource-reads/` | `plan.md`, `tasks.md`, `aar.md`, `independent-review.md` | S |
| `holonovel.md`, `holonovel/holonovel.md` | generated by `npm run assemble` | gen |
| `spec/build-phase-map.md` | content-hash line rewritten by `npm run assemble` (REQ-278) | gen |

No new tool, parameter, resource, or prompt: no `check-tool-surface`,
`surface-replay`, `surface-budget`, or tool-definitions step. No data, schema,
credential, network, or publication step in scope.

## 4. Steps (dependency order)

**Phase 0 — baseline and predicate confirmation.** The increment directory
carries `plan.md`, `tasks.md`, and an `aar.md` skeleton with the baseline
measured this session (check:fast 40/40; test:narrative 75/75;
competitive-gaps 30/30) and the probe transcript. Re-grep the edited locations
(`index.ts:4786-4787`, `:4814-4819`, `:13447-13448`, `:13486-13487`;
`spec/02-requirements.md:3760`; `appendices-reference.md:1872`, `:2061`) to
confirm line numbers, and confirm `F-5.12-1` is the only `Scheduled-roadmap`
row for this section.

**Phase 1 — re-probe the shipped behaviour (trust boundary: tool-output).**
Re-run the throwaway probe (or the trimmed equivalent) against the current tree
and paste the transcript into `aar.md`. It must show: observer `resolve`,
`visibility`, `audibility` all `[FORBIDDEN]`; the three resource reads
succeeding at the depths recorded in §2. Stop and report if resolve or either
query already succeeds (the predicate changed and the code step is
unnecessary), or if a resource read is refused (the access half of F-5.12-1 is
then real). The probe, not the plan, is authoritative.

**Phase 2 — admit the observer on the query paths.**
1. Delete `requireNotObserver()` at `holonovel/src/index.ts:4787`. Keep
   `requireNovel()`, `source` resolution, and the Player restriction. Add a
   comment stating the observer contract (REQ-305, REQ-366b, REQ-596/597).
2. Delete `requireNotObserver()` at `:4819`. Keep the Player refusal above it;
   add the same comment line naming REQ-305 and REQ-366b.
3. In `room-single` (`:13448`) and `thing-single` (`:13487`), extend the GM
   predicate to include `"observer"`. Name the reason in a short comment
   (REQ-305a unfiltered state surface; REQ-366b depth clause).
4. No description, schema, or generated-artifact edit; confirm by
   `git diff --stat` that `holonovel/tool-definitions.json` and
   `spec/audit/tool-surface-baseline.json` are untouched.

**Phase 3 — exercise both Novel types.**
1. `holonovel/scripts/test-narrative.ts:910-919`: create the fixed, lit
   `lantern` in `Throne Room` before switching badges, then extend the T417
   case per done bar 7. Use the existing `assertContains`/`assertNotContains`
   helpers and `readResource`; parse the resolve/query JSON with `JSON.parse`
   only after the `[FORBIDDEN]` assertion, so a refusal fails with a readable
   message.
2. `holonovel/scripts/test-competitive-gaps.ts:509-518`: insert the resolve and
   visibility assertions inside the existing observer window, before the badge
   reset at `:518`. Use `Scout` as the visibility target (see done bar 8), not
   the room name.

**Phase 4 — align the normative and catalogue surfaces.**
1. `spec/02-requirements.md:3760`: replace the REQ-366b body with the draft
   pinned in done bar 4 (one physical line).
2. `spec/appendices-reference.md:1872`: append the T417 clauses from done
   bar 5; keep the REQ column.
3. `spec/appendices-reference.md:2061`: append the T643 clause from done bar 6
   and extend the REQ column to `REQ-309, REQ-196a, REQ-366b`.
4. `spec/audit/review-register.md`: move F-5.12-1 into a dated `###` group at
   the top of `## Resolved`, with the corrected predicate.
5. `ROADMAP.md`: delete the section at `:15-25`.

**Phase 5 — bookkeeping and generation.** Add the CHANGELOG entry; regenerate
the coverage register (`npm run validate -- --write-register`); run
`npm run assemble`; complete `tasks.md` and `aar.md` (probe transcript, depth
decision, anchor unresolved-set comparison).

**Phase 6 — verify.** Run every check in §6 in order, then
`npm run session:close` for the single commit.

## 5. Edge cases and rollback

- **The Phase 1 probe shows `resolve` already admitted.** Then F-5.12-1's
  resolve half is stale; record the output, drop step 2.2, and keep the
  resource-depth fix and the query fix if those still reproduce.
- **A resource read is refused in the probe.** Then add the access fix to
  `room-single`/`thing-single` (the observer branch) rather than only the depth
  change, and widen the register text accordingly.
- **The observer now sees hazard `annotations` on `room://`.** This is the
  recorded decision (§1, alternative b) and matches `world://map`, which
  already renders them. If review rejects it, the minimal fallback is a
  separate `bannerDepth` predicate that excludes the `**Annotations:**` line
  for the observer only, asserted in T417; no spec body changes.
- **`room://throne_room` slug differs from the fixture's room id.** Read the
  list of rooms (`resources/list` or the GM `room://` read) or derive the id
  from the create result before asserting; do not hardcode a slug the fixture
  does not produce.
- **The T417 fixture has no active entity in a room.** `resolveIntentWorld`
  falls back to the first room (`index.ts:6163-6165`), and `visibility` with an
  explicit `source` does not need an active entity; assert on explicit
  `source` rather than the active entity so the case does not depend on
  `set_active` ordering.
- **`audibility` returns false for a same-room target.** Sound is modelled
  across rooms and one open exit (REQ-597); assert the field is present and
  boolean, and use the `north` exit to `Anteroom` if a positive case is
  required.
- **`test:narrative` case count changes unexpectedly.** Extending the existing
  `test()` callback keeps the count at 75; a new callback changes it, so update
  done bar 7 rather than the baseline.
- **REQ-366b exceeds 800 characters.** Drop the parenthetical `(REQ-305)` from
  the depth sentence (about 10 characters); the citation already appears
  earlier in the body.
- **`check-registers` sees a stale ROADMAP cross-reference.** The register row
  names the roadmap section; after deleting it, re-read the row's text so no
  `Scheduled-roadmap` row points at a removed section.
- **The anchor unresolved set grows.** Run the /tmp `resolvePredicate` checker
  over `holonovel/scripts/lib/holosuite-*.ts` before and after; edits below
  `index.ts:175` only, and the corpus is already stale, so the delta must be
  empty. A regression is a plan failure, not an invitation to repoint (the P2
  automation section owns that).
- **Rollback.** `git revert` of the single commit restores both guards, the two
  resource predicates, the harness cases, REQ-366b, both Appendix F rows, the
  register, the roadmap, and the changelog. No data, schema, or publication
  state is involved.

## 6. Verification summary

| Check | Command | Expected |
|---|---|---|
| Observer surface harness | `npm --prefix holonovel run test:narrative` | 75 passed, 0 failed |
| Badge-gate harness | `npm --prefix holonovel run test:competitive-gaps` | 30 passed, 0 failed |
| Query guards removed | `grep -c "requireNotObserver()" holonovel/src/index.ts` | 43 (baseline 45) |
| Resource depth | `grep -c 'isGM = .*observer' holonovel/src/index.ts` | 2 |
| REQ-366b length | `sed -n 3760p spec/02-requirements.md \| wc -m` | ≤800 (draft: 694) |
| REQ-366b citation | `grep -c "unfiltered state depth (REQ-305)" spec/02-requirements.md` | 1 |
| T417 row | `grep -c "read at Game Master depth" spec/appendices-reference.md` | 1 |
| T643 REQ column | `grep -c "REQ-309, REQ-196a, REQ-366b" spec/appendices-reference.md` | 1 |
| Generated surface untouched | `git diff --stat -- holonovel/tool-definitions.json spec/audit/tool-surface-baseline.json` | empty |
| Assemble + gates | `npm run assemble && npm run check:fast` | `check:fast: PASS` |
| Strict validation | `npm run validate:sdd` | 0 errors |
| Coverage register freshness | `npm run validate` | 0 errors |
| Anchor delta | /tmp `resolvePredicate` comparison, before vs after | no new unresolved predicate |
| Roadmap admission | `npm run check-roadmap` | pass |
| Register hygiene | `npm run check-registers:strict` | pass |
| Increment artifacts | `npm run check-loop-artifacts` | pass |
| Commit | `npm run session:close` | one commit, clean tree |

Unverified by design: `test:all` full green — the holosuite tiers already fail
on the stale anchor corpus (the open P2 section owns the repoint); the
pre-change unresolved set is recorded in `aar.md` and compared after the edit
rather than claimed green. The observer's hazard-`annotations` rendering on
`room://` follows the same predicate as the rest of the GM branch but has no
purpose-built fixture in T417; REQ-622's annotation contract is asserted at GM
depth by T741, and the observer parity is recorded in `aar.md` as a soft gap
rather than claimed green.

## 7. Open questions

None. The depth decision is grounded in REQ-305a and the already-shipped
`world://map` rendering; the alternative is recorded above and stays
reversible. The register premise correction is evidence-backed and stated in
the row text. Publication is out of scope; the plan stops at the local commit.
