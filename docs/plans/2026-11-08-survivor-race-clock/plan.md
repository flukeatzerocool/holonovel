# Plan — Survivor race clock: the faction-clock gap (REQ-233)

Session 2026-11-08. Base HEAD `920b833` (clean tree). Plan revision 2 —
revision 1 plus the user's two answers: the Survivors' race stays descriptive,
and the faction-resource badge filter ships in this increment. Gate depth:
standard (multi-file, state semantics, no remote/credential/destructive step).
Rollback cost: 1.

## Questions (user's words)

"draft plan for next roadmap item." `npm run status` reports one open item:
*Survivor race clock (P3)* — "Decide whether The Survivors' 0/10 faction clock
should advance on scene transitions and fire a 'first to the door' event, or
stay descriptive (REQ-233)."

User answers (this revision): (1) **descriptive** — The Survivors carry no
numeric race clock; (2) **include** the `faction://` / `factions://` badge
filter, since REQ-233b1 and §7.7 already require it.

## Done bar

**Done bar:** the generic faction clock is real — `manage_faction (action:
create)` with goals auto-creates a `clock_type: faction` countdown, a scene
transition advances a clocked faction by one tick through both transition paths,
a filled clock rotates `status` to the next goal, resets to zero, rewrites its
countdown, and surfaces a `[WARNING]` in `spec_health`'s `health_warnings`,
`manage_countdown (action: advance)` on a faction clock writes back to the
faction, a `fast_forward` skip leaves the clock alone, `remove`
deletes the clock, and a faction with no clock is untouched; The Survivors carry
goals, resources, and territory but no `clock`/`clock_max`, and the regenerated
starter differs only there; `faction://` and `factions://` return a Player
projection with no clock, status, goals, or resources; the auto-created clock is
not Player-visible through `countdown://active`; REQ-233b1 says the progress
clock is optional; T269 is implemented in `test-narrative` and T388's vacuous
assertion becomes a real clock read; tool definitions, surface baseline,
coverage register, README markers, `DECISIONS.md`, and assembled `holonovel.md`
are regenerated; the ROADMAP section is removed and the matching
`Scheduled-roadmap` row is Resolved; `test:narrative`, `test:starter-novel`,
`test:graph`, `test:memory-recall`, `test:tool-definitions`, `test:all`, root
`check:fast`, `check:conformance`, `playability`, and `build-order` pass; the
increment lands as one commit with plan/tasks/AAR and a terminal LOOP token;
nothing is pushed.

## Baseline (measured this session)

- `git rev-parse --short HEAD` → `920b833`; `git status --porcelain` empty.
- Root `npm run check:fast` → 37 passed / 0 failed, trailing `check:fast: PASS`.
- `npm run status` → 1 open roadmap item; 14 unpushed commits; version
  2026.11.08, latest tag v2026.11.07. Publication is a separate authorized step.
- Winning descent path: **84 transitions** (7 takes + 84 moves) measured with
  `buildWorldModel`/`findWinningPath` over `content/torre-nosferatu.json`; The
  Candle starts 30, gains 70 from seven caches, and ends at 16, so the economy
  is balanced against 84 transitions, not against 10.
- T269 appears in Appendix T only: `grep -r T269 holonovel/scripts` → no match.
- `npm run playability --novel content/torre-nosferatu.json` → `[clean]`.

## Findings

| ID | Severity | Finding | Predicate (file:line) |
|---|---|---|---|
| R1 | Major | A scene transition advances countdowns only; faction clocks never tick, so REQ-233b2's first sentence is unimplemented at both transition paths. | `holonovel/src/index.ts:5911` (`advanceSceneTransitionCountdowns` iterates `novel.countdowns` only); call sites `:4658` (parser move) and `:6057` (`manage_scene` set). |
| R2 | Major | `manage_faction (action: create)` does not auto-create the `clock_type: faction` countdown, so T269's first assertion is unsatisfiable. | `holonovel/src/index.ts:6989-7000` pushes the faction only; no `novel.countdowns.set`. |
| R3 | Major | A filled clock is clamped, never rotated: no goal/status advance, no new clock, no `[WARNING]`, so REQ-233b1's last sentence is unimplemented. | `holonovel/src/index.ts:682`, `:3413`, `:5730` (`Math.min(...)`); `:10782` (`faction_clocks` reports status only). |
| R4 | Major | `faction://` and `factions://` return the raw record to every badge, while REQ-233b1 and the §7.7 Faction row require a GM-filtered Player projection; a Player can read a clock the narration policy forbids. | `holonovel/src/index.ts:12404-12421`; contract `spec/04-runtime.md:260`; REQ-233b1 `spec/02-requirements.md:2131`. |
| R5 | Design | The Survivors' 0/10 clock, ticked per transition, fills at transition 10 of 84 — a survivor reaches the door on the seventh floor, ~12% into the descent. | `holonovel/content/torre-nosferatu.source.json:810-812`; 84-transition path (Baseline). |
| R6 | Minor | T269 is specced but no harness implements it; T388's assertions are vacuous (it reads a relationship and an `active_badge` string, never the clock) even though it sets an autonomy interval. | `spec/appendices-reference.md:1715`; `holonovel/scripts/test-narrative.ts:172-180`. |
| R7 | Minor | The coverage register grades REQ-233 bucket C on T408/T413/T415 — three coupling rows — while b1/b2's own mechanism has no evidence. | `spec/audit/req-coverage.md:211`. |
| R8 | Pre-existing | `countdown://active` ignores badge scope, so any countdown is Player-readable; the new faction mirror must not lean on that. | `holonovel/src/index.ts:12060-12064`; REQ-073 badge filtering `spec/02-requirements.md:1296`. |

R5 is the roadmap item's own question; R1–R4, R6–R8 are conformance gaps the
item exposed. No R is a register row beyond the existing `Scheduled-roadmap`
entry (`spec/audit/review-register.md:958-960`), which this increment resolves.

## Decisions

- **D1 — Descriptive (user).** The Survivors keep goals, resources, and
  territory; `clock` and `clock_max` are removed from the starter faction. The
  race stays narration (R5: a per-transition clock cannot land at the door
  without a playtest the roadmap trigger has not authorized). Rejected:
  mechanical with `clock_max ≈ 84` (needs play evidence) and keeping 0/10
  (fills ~8 times per descent).
- **D2 — `faction.clock` stays authoritative; one mutation helper.** The
  auto-created countdown is a display mirror: named after the faction,
  `clock_type: "faction"`, `type: "narrative"` (delta 1: the union stays closed;
  the `fast_forward` loop skips `clock_type: "faction"` and the transition loop
  skips it via `on_scene_transition: false`), ticks `clock_max`, `total`
  `clock_max`, direction decrement, `on_scene_transition: false`,
  `badge_scope: "game_master"`. Every clock
  mutation goes through `advanceFactionClock(novel, f, delta)`, which clamps,
  syncs the mirror, and calls the fill helper — one writer, four callers:
  REQ-233b2 transitions (`:5911`), REQ-235 choices (`:3413`), REQ-338 autonomous
  (`:682`), and REQ-336/P53 pacing ticks. Rejected: deriving `f.clock` from the
  countdown, which breaks imported factions that carry a clock but no
  countdown, and per-site syncs, which drift.
- **D3 — Fill semantics without a new field.** `status` holds the current goal
  text: on fill, the next goal in `goals` order becomes `status` (a `status`
  that is not a goal selects `goals[0]`), `clock` resets to 0, and the mirror is
  rewritten; a faction with a clock but no goals resets only (no rotation). The
  fill notice is an in-memory per-Novel list (the
  `relationshipMarkers` precedent) rendered into `buildSpecHealth`'s existing
  `health_warnings` array (`:11525`, appended at call time), so no new persisted
  field reaches §7.7 or the REQ-240a/241a/334b enumerations. A restart drops the
  notice, like the relationship marker. Rejected: a persisted fill field (a
  §7.7 class contract for a transient line) and deriving "recently filled" from
  `clock === 0 && status` (ambiguous).
- **D4 — Clockless is the default guard.** `clock`/`clock_max` become optional
  on `FactionState`; `hasFactionClock()` gates the tick, the fill, the mirror,
  and every display site (`:842` territorial line, `:10782` health). A faction
  without a clock behaves exactly as it does today.
- **D5 — Write-back, not expiry.** `manage_countdown (action: advance)` on a
  faction mirror updates `faction.clock`; reaching zero fills the faction
  instead of deleting the countdown and firing `world_effect`.
- **D6 — Player projection.** `faction://`, `factions://`, and
  `manage_faction (action: list)` return `id`, `name`, and `description` for a
  Player badge (delta 1: `manage_faction list` already projects that shape, and
  `territory` names unvisited rooms); `clock`, `clock_max`, `status`, `goals`,
  and `resources` are GM-only on all three surfaces. Rejected: `[FORBIDDEN]`
  like secrets — §7.7 says read-only, not hidden.
- **D7 — The mirror is not Player-visible.** `CountdownState.badge_scope`
  defaults to `shared` (today's behavior) and `countdown://active` omits a
  `game_master` countdown for a Player. This closes R8 for the new surface
  without widening the change to every pre-existing countdown.
- **D8 — One spec clause.** REQ-233b1's "with goals, resources, and a progress
  clock" becomes "with goals, resources, and an optional progress clock"
  (727 chars / 9 sentences today; the edit keeps the sentence count and the
  800-char ceiling). REQ-233b2 already reads correctly for a faction with no
  clock. No new REQ, no section-map row, no Appendix T row. §7.7.0's class
  contract and the property tables name no countdown sub-field
  (`grep badge_scope spec/04-runtime.md` → no match), and the new optional
  `CountdownState.badge_scope` adds no property group, so §7.7 and the
  fingerprints are untouched; Phase 3 re-confirms this before the edit. If
  `validate --sdd-strict` holds REQ-233b1's body against the edit, the fallback
  is to leave the REQ untouched and record D1 in `DECISIONS.md` (the clause
  describes the tool's capability, not a content mandate).
- **D10 — `fast_forward` does not tick faction clocks.** A fast-forward
  advances `narrative` countdowns through its own loop (`:6010-6020`); faction
  clocks are transition-driven (P1) plus the pacing tick (P53). The mirror keeps
  `type: "narrative"` but the loop skips `clock_type: "faction"` (delta 1), so a
  skip can neither drift the clock nor delete the mirror.
  Rejected: an interval-scaled tick, which would make an unwatched skip
  out-advance the race's own authoring.
- **D9 — Register coupling.** Shipping removes the ROADMAP section and moves the
  `Scheduled-roadmap` row to `Resolved` in the same increment
  (`scripts/lib/register-checks.ts` gates the cross-reference).

## Blast radius

| File | Phase | Change | Size |
|---|---|---|---|
| `holonovel/src/core/state.ts` | 1, 3 | `FactionState.clock`/`clock_max` optional; `CountdownState.badge_scope` | S |
| `holonovel/src/index.ts` | 1, 3 | `hasFactionClock`, `advanceFactionClock` (clamp/sync/fill), `fillFactionClock`; hooks in create/update/remove and the four tick callers; guards at `:842` and `:10782`; Player projection; `countdown://active` filter; tool descriptions | M |
| `holonovel/content/torre-nosferatu.source.json` | 2 | Drop `clock`/`clock_max` from `factions[0]` | S |
| `holonovel/content/torre-nosferatu.json` | 2 | Regenerated by `build:starter-novel` | S |
| `holonovel/scripts/test-narrative.ts` | 4 | T269 (create/countdown/resource/transition/advance/remove/Player projection/clockless); T388 real clock read | M |
| `spec/02-requirements.md` | 3 | REQ-233b1 "an optional progress clock" | S |
| `holonovel/tool-definitions.json` | 1 | Regenerated by `generate-tool-definitions.ts` | S |
| `spec/audit/tool-surface-baseline.json`, `holonovel/DECISIONS.md` | 1 | `surface-budget -- --write`; recorded budget line if it moved | S |
| `spec/audit/req-coverage.md` | 4 | `npm run validate -- --write-register` (REQ-233 gains T269) | S |
| `holonovel/DECISIONS.md` | 4 | Dated entry: descriptive decision, clock authority, fill semantics | S |
| `spec/audit/review-register.md` | 4 | `Scheduled-roadmap` row → `Resolved` | S |
| `ROADMAP.md` | 4 | Remove the P3 section | S |
| `README.md`, `holonovel/AGENTS.md` | 4 | `npm run refresh-properties` | S |
| `holonovel.md`, `holonovel/holonovel.md` | 3 | Assembled output (`npm run assemble`) | S |
| `CHANGELOG.md` | 4 | One dated entry | S |
| `docs/plans/2026-11-08-survivor-race-clock/*` | all | Plan, tasks, AAR | S |

## Phase 1 — Make the faction clock real (R1, R2, R3, R6-T388)

1. Enumerate first: `grep -rn "countdown" holonovel/scripts/test-*.ts` over every
   harness that creates a faction, and list each assertion that would see the
   new mirror (countdown listings, counts, briefing lines). Reconcile each in the
   same phase rather than discovering it in `test:all`; T-narrative:287
   (`countdown: guard-trap`) is the first known contact.
2. `core/state.ts`: make `FactionState.clock` and `clock_max` optional; add
   `CountdownState.badge_scope?: "game_master" | "shared"` and
   `CountdownState.clock_type` (D7).
3. `index.ts`: `hasFactionClock(f)`; `advanceFactionClock(novel, f, delta)`
   (clamp, sync, fill) and its mirror writer (D2); `fillFactionClock` (D3).
4. Call `advanceFactionClock` once per clocked faction from
   `advanceSceneTransitionCountdowns` (`:5911`) so both transition paths — the
   parser move `:4658` and `manage_scene` set `:6057` — are covered; route the
   REQ-235 choice tick (`:3413`), the REQ-338 autonomous tick (`:682`), and the
   P53 pacing tick through the same helper; skip `clock_type: "faction"` in the
   `fast_forward` loop (`:6012`) so a skip neither drifts nor deletes the mirror
   (D10, delta 1).
5. `manage_faction (action: create)`: auto-create the mirror when
   `goals.length > 0` (D2); `remove`: delete the mirror with the faction;
   `update`: clamp `clock` to a reduced `clock_max`, re-derive `status` when the
   current goal left `goals`, and re-sync the mirror.
6. `manage_countdown (action: advance)`: on a `clock_type: "faction"` mirror,
   write back through `advanceFactionClock` and fill at zero instead of deleting
   (D5). First confirm no sibling REQ binds that action incompatibly — REQ-073
   (countdown), REQ-322 (`vow:<name>` clocks), REQ-235 (choice ticks), REQ-338
   (autonomous ticks); the `clock_type: "faction"` discriminator is the seam.
7. Guards: omit the clock parenthetical in the `[territorial]` line (`:842`) and
   report `clock: null, clock_max: null` for a clockless faction in
   `manage_novel (action: save_context)`'s `faction_clocks` (`:10782`, REQ-232d),
   and skip clockless factions in every mutation caller (D4).
8. `manage_faction` and `manage_countdown` descriptions name the auto-created
   faction clock, the optional clock, and the write-back.

**Verification:** `cd holonovel && npx tsx scripts/test-narrative.ts && npm run
test:graph && npm run test:memory-recall && npm run test:competitive-gaps`.

## Phase 2 — The Survivors stay descriptive (R5, D1)

9. Remove `clock` and `clock_max` from `factions[0]` in
   `torre-nosferatu.source.json`; keep `status`, `goals`, `resources`,
   `territory`.
10. Regenerate `holonovel/content/torre-nosferatu.json` via
    `npm run build:starter-novel`; confirm the diff is confined to those two
    keys.

**Verification:** `cd holonovel && npm run test:starter-novel && npm run
test:graph && npm run test:memory-recall`; `npm run playability`.

## Phase 3 — Badge filter and spec clause (R4, D6, D8)

11. Player projection on all three read surfaces (D6, delta 1):
    `faction://` and `factions://` return `{ id, name, description }`, and
    `manage_faction (action: list)` applies the same row in both the detail and
    summary branches; Game Master and Editor keep the full record.
12. `countdown://active`: omit a `badge_scope: "game_master"` countdown for a
    Player badge (D7).
13. REQ-233b1: "and an optional progress clock" (D8). Before the edit,
    re-confirm §7.7.0's class contract and the clone/checkpoint/archive
    enumerations name no countdown or faction sub-field
    (`grep -n "badge_scope\|clock_type" spec/04-runtime.md`); if they do, add
    the field there and run `npm run build-order` for fingerprint
    regeneration. Then `npm run assemble && npm run validate --sdd-strict` and
    apply the D8 fallback if REQ-233b1's shape trips.

**Verification:** `npm run assemble && npm run validate --sdd-strict`.

## Phase 4 — Evidence and registers (R6, R7, D9)

14. T269 in `test-narrative.ts`, one block: create with a goal → assert a
    `clock_type: faction` countdown exists and `faction://<id>` reports
    `clock: 0/10`; `manage_countdown (action: advance)` → assert the faction
    clock moved; two `manage_scene (action: set)` transitions → assert +2 and
    the mirror agrees; a `fast_forward` skip → assert no change (D10); ten
    advances → assert `status` rotated to the next goal, `clock` reset, and
    `manage_diagnostics (action: health)`'s `health_warnings` carries the fill
    line; `manage_faction (action: remove)` → assert the faction and mirror are
    gone; a Player `faction://` read → assert no `clock`/`goals`/`resources`
    keys and no mirror in `countdown://active`; a faction created with no goals
    → assert no countdown and no tick after a transition; a clockless imported
    faction → assert `save_context.faction_clocks` carries null clock values.
15. T388: replace the ignored `manage_relationship` read and the
    `active_badge` assertion with a `faction://` clock read at each interval
    boundary (R6).
16. Regenerate: `npx tsx holonovel/scripts/generate-tool-definitions.ts`;
    `npm run surface-budget -- --write`; sync the `DECISIONS.md` budget line if
    it moved; `npm run validate -- --write-register`;
    `npm run refresh-properties`.
17. Registers: move the `Scheduled-roadmap` row to `Resolved`; delete the P3
    ROADMAP section; add the dated `DECISIONS.md` entry (D1, D2, D3, D5, D6, D7).
18. CHANGELOG: one dated entry covering all phases, headed 2026-11-08 — the
    local date, which agrees with the version (2026.11.08) and with
    `session:close`'s default (UTC is already 2026-11-09).

**Verification:** `cd holonovel && npm run test:narrative && npm run
test:tool-definitions && npm run test:all && npm run typecheck`.

## Commit order and gates

One commit: the session changes `spec/`, so `session:close` treats it as a spec
increment and refuses to split it.

1. Write `plan.md`, `tasks.md`, and a complete `aar.md` (measured evidence,
   terminal LOOP token) before committing — `check-loop-artifacts` gates it.
2. Stage everything; run `npm run session:close`.
3. Publication is a separate authorized step and is out of scope.

## User impact

No save migration: `faction.clock` keeps its meaning, an absent clock is the only
new shape, and the starter reseeds only in a fresh data directory (REQ-565). A
Player badge loses read access to clock, goals, resources, and status on
`faction://` and loses the faction mirror from `countdown://active` — both are
contract-conformance changes, not data changes. GM-created factions gain a
countdown that appears in countdown listings and advances on transitions, which
is REQ-233b2's stated behavior.

## Risks and rollback

- **Mirror drift** between `faction.clock` and its countdown — `advanceFactionClock`
  is the only writer; T269 asserts both stores after a transition, an advance,
  and a fast-forward.
- **Starter freshness** — `check-starter-freshness` and a confined diff catch a
  bad regeneration; revert with `git checkout -- holonovel/content`.
- **Double counting** — the mirror is `on_scene_transition: false` and
  `type: "faction"`, so neither the transition loop nor the `fast_forward`
  narrative loop touches it; the faction tick is the only scene writer.
- **Existing-harness contact** — a new countdown per faction can shift countdown
  listings and briefing lines in other harnesses; Phase 1 step 1 enumerates them
  before the code changes, and `test:all` is the backstop.
- **Fill notice is ephemeral** — an in-memory list drops on restart (the
  `relationshipMarkers` precedent); `spec_health` truthfulness after a restart
  is a recorded tradeoff, not a defect.
- **Description budget** — two tool descriptions grow; the baseline and the
  `DECISIONS.md` recorded line move together (REQ-429/REQ-571).
- **REQ-233b1 shape** — D8's fallback keeps the spec untouched if the edit trips
  the sentence check.
- **Rollback** — reversible edits (cost 1); no migration, nothing destructive.

## Open questions

None — both were answered for this revision.
