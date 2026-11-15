# Plan — Player narrative threads (F-S4)

Status: draft v2 (cold pass v1 **passed** — 0 Blockers / 4 Majors / 6 Nits, all
resolved; see § *Review state*) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-14-player-narrative-threads/`
Rollback cost: 1 (one revert: registry badge set + Player filter in `index.ts`,
one harness extension, one Appendix F row, DECISIONS/register/roadmap/changelog
bookkeeping)
Evidence class: repo
Trust boundary: every premise is read from the working tree at HEAD; no web,
user, or tool-output content enters the plan.

## Review state

Cold pass v1: `/tmp/opencode/player-threads-cold-review.md`, sha256
`71f3bfa50cd10dbf47394d6b906862b24de8bd5b003f4994f3f217b2e1bf93ac`, reviewed
plan sha256
`ea1c8e4de9a6879fff6347f0c862408c7bc409fc57d5b21f16506c9f132cbb7c`, verdict
**passed** (0 Blockers / 4 Majors / 6 Nits). All findings applied in v2:

- **M1.** The predicate is stated per branch: `c.badge !== "player"` for
  decisions, coupling advisories, and the vow suggestion; the disposition branch
  keeps `c.badge === "game_master"`; observer is explicitly unchanged.
- **M2.** The done bar and T330 now cover the coupling advisory and the
  `Vow countdown suggestion:` line, plus the Player empty-marker leg.
- **M3.** Filter-before-cap is specified for bonds and vows.
- **M4.** The bar is a bolded `Done bar` line
  (`scripts/lib/loop-artifacts.ts:45`), with the criteria restated below it.
- **N1–N6.** Line numbers corrected (`index.ts:15527`, spec `:1328`,
  `test-briefing.ts:542-546`/`:552-554`); the baseline is labelled a session
  observation; step 5 corrects F-S4's stale `760-772` pointer; conflict 2 names
  REQ-289e's specific `party` rule; the countdown-surface agreement claim is
  narrowed to the pre-existing child-scope difference; step 2 names the
  `manage_character` create/set_active calls.

Residual independence note: the cold pass ran as one cold context (no nested
dispatch), so `independence: fresh` records the artifact hash rather than five
separate stage dispatches.

## Questions

1. Which roadmap item is next? `ROADMAP.md:15-25` § *Player narrative threads
   (P1)* — review-register **F-S4**: REQ-281b requires a Player narrative-threads
   surface, and the registry entry is `badges: GM_OR_OBSERVER`
   (`holonovel/src/index.ts:17571`), so a Player briefing carries no
   unresolved-thread signal at all. T330 asserts the GM path only
   (`holonovel/scripts/test-output-contracts.ts:822-833`).
2. Why not just widen `badges` and ship? Because the section renders
   unresolved decisions, NPC dispositions, coupling advisories, and the
   vow-countdown suggestion — all GM-only content — and REQ-281b restricts the
   Player to *own-entity bonds and `shared`-scope content*. Widening the badge
   set without filtering leaks GM knowledge into the Player context.
3. What is out of scope? The rest of the U1–U8 review sweep, harness test-ID
   label hygiene, anchor-repoint automation, and the loop-gate re-measurement —
   all later `ROADMAP.md` sections. No REQ body changes: REQ-281b is already
   normative and the filter rules resolve against existing REQs (see
   § *Resolved Player filter rules*).

## Objective

Make `badge_briefing` render `narrative_threads` under the Player badge with
badge-filtered content — own-entity bonds, `shared`-scope countdowns, and
shared/party-scope vows — while the GM path keeps its full five-item list, so
REQ-281b/281c's acceptance criterion is true of both legs and F-S4 closes.

## Evidence (repo)

| Claim | Predicate |
|---|---|
| The section is GM/observer only | `holonovel/src/index.ts:17568` (token), `:17571` (`badges: GM_OR_OBSERVER`); composer gate `:18357` (`if (section.badges && !section.badges.includes(badge)) continue;`) |
| The five item sources are GM-oriented as written | `index.ts:17578-17615` — unresolved decisions `:17580-17581`, open bonds `:17582-17583`, vows `:17584-17590`, countdowns `:17591-17603`, dispositions `:17604-17607`, coupling advisories and the vow-countdown suggestion `:17608-17615` |
| The empty-state marker exists and is per-REQ-281c | `index.ts:17616-17618` (`[No unresolved threads.]`) |
| Own-entity filtering already has a Player branch to reuse as precedent | `index.ts:1141-1151` (`relationshipMarkerLines`; Player branch `:1147-1149`) |
| Countdown badge filtering already exists for the resource surface | `index.ts:15522-15527` (predicate `cd.badge_scope !== "game_master"` at `:15527`; absent scope means shared) |
| `manage_countdown (action: set)` writes no `badge_scope`; only the faction mirror does | `index.ts:8596-8628` (schema), `index.ts:7612` (`badge_scope: "game_master"` on the mirror) |
| Vows carry a scope, and REQ-289e names the Player read rule | `holonovel/src/core/state.ts:574-586`; `spec/02-requirements.md:1661` (`shared` or `party`) |
| Story-journal entries in the briefing are GM-only, so unresolved decisions stay off the Player leg | `spec/02-requirements.md:1328` (REQ-109c3: "story journal entries … (GM only, REQ-246)") |
| A journal entry's `entity_ids` is the active entity at record time | `index.ts:10067` (`entity_ids: activeId ? [activeId] : …`) |
| REQ-281b/281c state the contract and cite T330 | `spec/02-requirements.md:1344-1348` |
| T330 asserts the GM leg only, and its Appendix F row describes a different test | `holonovel/scripts/test-output-contracts.ts:822-833`; `spec/appendices-reference.md:1796` (row claims lore-derived threads, trigger/content/priority, and empty-Novel omission) |
| F-S4 carries this predicate and its roadmap home | `spec/audit/review-register.md:2576-2586`; `ROADMAP.md:15-25` |
| DECISIONS.md currently records the Player omission as intended behavior | `holonovel/DECISIONS.md:418-420` (relationship-marker **D2**) |
| The register lists REQ-281 (3 sub-parts) as bucket C on T330 | `spec/audit/req-coverage.md:256` |
| §5.5 is not a fingerprinted section, so no fingerprint regeneration | `scripts/lib/contract-fingerprint.ts:27`, `:37-43` (no §5.5) |
| Baseline gates are green and the tree is clean (before implementation) | session observation at HEAD `586d38e`, before the first edit: `npm run check:fast` → `41 passed, 0 failed` + `check:fast: PASS`; `git status --porcelain` → empty. A gate's summary line is provisional; step 9 re-runs the gate and records the result in the AAR |

## Specification conflicts this plan resolves

1. **REQ-281b's Player clause vs DECISIONS **D2**.** D2 records "the Player
   briefing does not render the `narrative_threads` section in this build" as a
   deliberate GM-advisory choice. That is the deviation F-S4 names, not a
   contract; D2 is amended to the new behavior and the retained active-entity
   filter stops being "for a future Player section".
2. **REQ-281a's five items vs "only own-entity bonds and `shared`-scope
   content".** The five items are not homogeneous in scope. The rule table below
   reads 281b as a membership restriction over 281a's items, each resolved
   against the REQ that owns its scope. The narrow reading is explicit: REQ-281b
   says "`shared`-scope content", and REQ-289e's specific vow rule ("`shared`
   **or `party`**") is narrower still, so vow `party` scope is admitted by the
   specific REQ rather than by 281b's general phrase. No REQ edit is needed; the
   reading is recorded in DECISIONS.md so a later reader does not re-derive it.
3. **Appendix F T330 vs the test it names.** The row describes lore-derived
   threads, trigger/content/priority, and empty-Novel omission; the test asserts
   a countdown and an NPC disposition. The row is rewritten to the assertions
   the test actually makes, including the new Player legs.

## Resolved Player filter rules

| Item (REQ-281a) | Player predicate | Governing REQ |
|---|---|---|
| (a) unresolved decisions | omitted for Player (`c.badge !== "player"`) | REQ-109c3, REQ-246 |
| (b) open bonds | `entity_ids` includes the active entity | REQ-281b ("own-entity bonds") |
| (c) countdowns | `badge_scope !== "game_master"` | REQ-073 (same rule as `countdown://active`) |
| (d) NPC dispositions | unchanged: `c.badge === "game_master"` (observer never saw them) | REQ-281b, REQ-075 |
| (e) active vows | `scope` is `shared` or `party` | REQ-289e |
| relationship markers (REQ-236b) | own-entity only (existing branch) | REQ-236a/b |
| coupling advisories (REQ-355–357) | omitted for Player (`c.badge !== "player"`) | REQ-109e supplementary guidance |
| vow-countdown suggestion (REQ-322a) | omitted for Player (`c.badge !== "player"`) | REQ-322a ("The GM may accept") |
| pacing signal | rendered for both badges | REQ-336/351 — a system status line, not entity-scoped narrative content |

**Observer behavior is unchanged.** The GM-strict disposition branch stays as
it is, and the other three GM-oriented branches use `c.badge !== "player"` — not
`=== "game_master"` — because observer sees them today and this increment does
not narrow the observer seat.

**Filter before cap.** Each capped source (decisions and bonds) filters by the
Player predicate first and then applies its existing tail cap (`slice(-3)`,
`index.ts:17581-17583`), so a Player-visible bond is never hidden behind
GM-only bonds that consume the cap. The move is a reorder, not a new cap; vows
and countdowns carry no tail cap.

Player with no visible thread item renders the REQ-281c marker
`[No unresolved threads.]`; a Player with no active entity still sees shared
countdowns and shared/party vows, and no bonds.

Rejected alternatives: (i) widen `badges` alone — leaks decisions and
dispositions; (ii) add a new `shared` flag to story entries — a §7.7 state
surface plus REQ-240a/241a/334b enumerations for a filter the entity IDs
already answer; (iii) give the Player a separate section token — REQ-281b fixes
one token and its adjacency after entities.

## Change entries

1. **[M] `holonovel/src/index.ts` — badge-aware thread rendering.**
   Change the `narrative_threads` entry's `badges` to `["game_master",
   "observer", "player"]`. Then, per the table above: leave the unresolved
   decisions, coupling-advisory, and vow-countdown-suggestion branches on
   `c.badge !== "player"`; leave the disposition branch on
   `c.badge === "game_master"`; filter bonds by `c.entity?.id` membership,
   countdowns by `cd.badge_scope !== "game_master"`, and vows by
   `v.scope === "shared" || v.scope === "party"` **before** each source's
   existing `slice(-3)` cap. Keep the empty-marker fallback so the Player leg
   renders rather than vanishing (`empty: "marker"`, `hasContent: () => true`).
   Carry the REQ citations in comments as the file does elsewhere.
   **Verify:** manual `badge_briefing` under both badges in the harness run.
2. **[S] `holonovel/scripts/test-output-contracts.ts` — T330 Player legs.**
   Extend T330 rather than add an ID (the roadmap permits it and REQ-281c cites
   T330). Keep the two existing GM assertions. Setup: `manage_character (action:
   create)` for two characters, `plan.md`'s active-entity step is
   `manage_character (action: set_active)` (`test-briefing.ts:531` precedent),
   `manage_story (action: record, type: "bond")` while each is active,
   `manage_story (action: record, type: "decision")`,
   `manage_vow (action: set, scope: "shared")` and a second with
   `scope: "game_master"`, plus the existing countdown and hostile NPC. Then
   `set_badge (badge: "player")` and assert present: the own-entity bond, the
   shared countdown, the shared vow; assert absent: the unresolved decision, the
   non-own bond, the GM-scope vow, the NPC disposition, the coupling advisory
   text, and the `Vow countdown suggestion:` line. Finally, a second player
   pass on a Novel with nothing visible asserts the `[No unresolved threads.]`
   marker.
   No negative *countdown* leg: `manage_countdown (action: set)` has no
   `badge_scope` parameter (`index.ts:8596-8628`), so only a faction-clock mirror
   (`index.ts:7612`) can produce a GM-scope clock; the countdown predicate is
   covered by the same code path as `countdown://active` and is asserted
   positive only.
   **Verify:** `npm --prefix holonovel run test:output-contracts`.
3. **[S] `spec/appendices-reference.md:1796` — T330 row.** Rewrite the
   description to the assertions the test makes (GM list, Player filtered list,
   empty-state marker), citing REQ-281b/281c as well as REQ-281.
   **Verify:** `npm run assemble` then `npm run check:fast`.
4. **[S] `holonovel/DECISIONS.md` — record the resolution.** Amend
   relationship-marker **D2** (`:418-420`) to state the Player now renders the
   section with the active-entity filter live, and add a bullet to the
   *Briefing section registry* entry (`:75-95`) recording the per-item Player
   predicate table's shape (decisions/dispositions/advisories GM-only; bonds
   own-entity; countdowns by `badge_scope`; vows by `scope`, REQ-289e).
   **Verify:** `check-registers` (no table contract to regenerate).
5. **[S] `spec/audit/review-register.md` — close F-S4.** Move it from
   *Scheduled-roadmap* to *Resolved* with the predicate
   (`spec/02-requirements.md:1344-1348`, `index.ts:17568-17571`) and the
   verifying test (`test-output-contracts.ts:822+`, T330). The entry's stale
   pointer to `test-output-contracts.ts:760-772` (register `:2581`) is corrected
   to the actual T330 range in the same move.
   **Verify:** `npm run check-registers`.
6. **[S] `ROADMAP.md` — remove § *Player narrative threads (P1)*.** The section
   closes when F-S4 is `Resolved` and a harness asserts the Player path; both
   hold after steps 2 and 5.
   **Verify:** `npm run check-roadmap`; `npm run check-registers` (the register
   cross-reference must not dangle).
7. **[S] `CHANGELOG.md` — dated entry** under a new `## 2026-11-14 — Player
   narrative threads` heading describing the implementation, the T330 extension,
   and the register/roadmap closure.
   **Verify:** `npm run session:close` consumes the top heading as the subject.
8. **[S] Increment artifacts** — this `plan.md`, `tasks.md`, and `aar.md`
   written at close with a `LOOP PAUSED`/`LOOP OPEN` terminal token
   (`scripts/lib/loop-artifacts.ts:38-89`).
   **Verify:** `npm run check-loop-artifacts`.
9. **[S] Regeneration and final gate.** `npm run assemble`; run
   `npm run validate -- --write-register` only if the coverage audit reports the
   register stale (REQ-281's bucket may move off C once the Player leg is
   exercised); then `npm run check:fast` and capture its exit code (the trailing
   `check:fast: PASS` line is the tell), plus
   `npm --prefix holonovel run test:output-contracts` and
   `npm --prefix holonovel run test:briefing`.
   **Verify:** all four commands; paste the pass counts into the AAR.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | registry badge set + per-item Player predicates | M |
| `holonovel/scripts/test-output-contracts.ts` | T330 Player and negative legs | S |
| `spec/appendices-reference.md` | T330 row rewritten | S |
| `holonovel/DECISIONS.md` | D2 amended; registry decision gains the Player rule | S |
| `spec/audit/review-register.md` | F-S4 → Resolved | S |
| `ROADMAP.md` | section removed | S |
| `CHANGELOG.md` | dated entry | S |
| `docs/plans/2026-11-14-player-narrative-threads/` | plan, tasks, AAR | S |
| `holonovel.md` | regenerated by `npm run assemble` | S |
| `spec/audit/req-coverage.md` | regenerated only if the audit reports drift | S |

## Edge cases

- **Player with no active entity.** Bonds and relationship markers are absent;
  shared countdowns and shared/party vows still render. No crash: the bond and
  marker filters take `c.entity?.id` (`index.ts:17579`, `:1147`).
- **All Player sources empty.** The REQ-281c marker renders; the section is not
  omitted, so the Player briefing keeps a stable heading set.
- **A faction clock mirror.** `badge_scope: "game_master"` (`index.ts:7612`) is
  hidden from the Player by the same predicate `countdown://active` uses. The
  two surfaces agree for top-level clocks; they can differ for a GM-scope
  *child* under a shared parent, because the resource lists `linked_children`
  names without filtering the child's own scope (`index.ts:15528`) while the
  briefing filters per child. That narrow difference is pre-existing, is not
  reached by a tool-created clock (`manage_countdown` writes no `badge_scope`),
  and is recorded rather than fixed here.
- **Linked countdown children.** The parent/child walk is unchanged; filtering
  applies per rendered clock, so a visible parent still renders the children a
  Player may see and omits a GM-scope child.
- **T109's Player section inventory.** The new heading is already in the test's
  known-heading set (`test-briefing.ts:542-546`) and in its critical list
  (`:552-554`), so no edit is expected; if T109 fails, the failure is a real
  ordering regression, not a test to relax.
- **Truncation.** Threads stay in the critical layer with unchanged emission
  position; a longer Player section can push supplementary sections out first,
  which is REQ-135's intended order.

## Verification

- `npm run assemble` — regenerate `holonovel.md`.
- `npm run check:fast` — capture the exit code of the un-piped command; trailing
  `check:fast: PASS` required. `check-markers`/`validate` will re-read the
  register and appendix.
- `npm --prefix holonovel run test:output-contracts` — T330 both legs.
- `npm --prefix holonovel run test:briefing` — T109 inventory and ordering.
- `npm run check-registers` and `npm run check-roadmap` — F-S4/roadmap
  cross-reference.
- `npm run check-loop-artifacts` — plan/tasks/AAR present with a LOOP token.
- No fingerprint regeneration: §5.5 is outside
  `scripts/lib/contract-fingerprint.ts`'s section lists; if
  `check-fingerprint-sync` still fails, stop and re-derive rather than editing
  the fingerprint by hand.

**Done bar:** Player legs render the own-entity bond, shared countdown, and shared vow with none of the decision, non-own bond, GM-scope vow, disposition, coupling advisory, or vow suggestion; the GM assertions are unchanged; F-S4 is `Resolved` and the roadmap section is gone; `check:fast` exits 0 with both harnesses at 0 failures; `aar.md` carries a LOOP token.

The bar restated as verifiable criteria:

1. Player legs of T330 (positive, negative, and empty-marker) pass.
2. The two pre-existing T330 GM assertions still pass unchanged.
3. F-S4 is `Resolved` with a predicate, `ROADMAP.md` no longer carries the
   section, and `check-registers`/`check-roadmap` pass.
4. `npm run check:fast` exits 0 with a trailing `PASS` line;
   `test:output-contracts` and `test:briefing` report 0 failures.
5. The increment's `aar.md` exists with a terminal LOOP token.

## Risks

- **Filter ambiguity for a future item.** The table is recorded in DECISIONS.md
  so a new REQ-281a item does not silently default to Player-visible.
- **Observer badge.** Observer keeps the GM list and its current content: the
  disposition branch stays GM-strict, and the three other GM-oriented branches
  use `!== "player"`, so the observer seat neither gains nor loses content.
