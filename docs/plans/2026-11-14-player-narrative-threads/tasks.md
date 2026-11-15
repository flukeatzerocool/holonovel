# Tasks — Player narrative threads (F-S4)

Plan: `plan.md` · Kind: planned · Depth: standard

## 1. Implementation

- [x] 1.1 `holonovel/src/index.ts`: `narrative_threads` `badges` becomes
      `["game_master", "observer", "player"]`.
- [x] 1.2 Gate unresolved decisions, coupling advisories, and the vow-countdown
      suggestion on `c.badge !== "player"` (REQ-109c3/REQ-246, REQ-322a); keep
      the GM output identical.
- [x] 1.3 Filter open bonds by `c.entity?.id` membership for the Player
      (REQ-281b), before the existing `slice(-3)` cap.
- [x] 1.4 Filter vows to `scope === "shared" || scope === "party"` for the
      Player (REQ-289e), before the cap.
- [x] 1.5 Filter countdowns on `badge_scope !== "game_master"` (REQ-073).
- [x] 1.6 Keep NPC dispositions GM-strict (unchanged) and leave observer
      content as it is.
- [x] 1.7 Confirm the empty marker still renders for a Player with nothing
      visible (REQ-281c).

## 2. Harness

- [x] 2.1 Extend T330 (`holonovel/scripts/test-output-contracts.ts`) with the
      Player-positive leg: own-entity bond, shared countdown, shared vow.
- [x] 2.2 Add the Player-negative leg: unresolved decision, non-own bond,
      `game_master`-scope vow, NPC disposition, coupling advisory, and the
      `Vow countdown suggestion:` line.
- [x] 2.3 Add the Player empty-marker leg.

## 3. Specification and records

- [x] 3.1 Rewrite the Appendix F T330 row to the assertions the test makes and
      cite REQ-281b/281c.
- [x] 3.2 Amend `holonovel/DECISIONS.md` relationship-marker D2.
- [x] 3.3 Add the per-item Player predicate rule to the briefing-registry
      decision entry.
- [x] 3.4 Move F-S4 to `## Resolved` in `spec/audit/review-register.md` with the
      predicate and the verifying test.
- [x] 3.5 Remove `ROADMAP.md` § *Player narrative threads (P1)*.
- [x] 3.6 Add the dated `CHANGELOG.md` entry.

## 4. Regeneration and gates

- [x] 4.1 `npm run assemble`.
- [x] 4.2 (unchanged) `npm run validate -- --write-register` only if the coverage audit
      reports the register stale.
- [x] 4.3 `npm run check:fast` — capture the un-piped exit code; require the
      trailing `check:fast: PASS`.
- [x] 4.4 `npm --prefix holonovel run test:output-contracts`.
- [x] 4.5 `npm --prefix holonovel run test:briefing`.
- [x] 4.6 `npm run check-registers` and `npm run check-roadmap`.
- [x] 4.7 `npm run check-loop-artifacts` after `aar.md` is written.

## 5. Close

- [x] 5.1 Write `aar.md` against the plan's done bar; end with `LOOP PAUSED` or
      `LOOP OPEN`.
- [ ] 5.2 `npm run session:close` for the single spec-increment commit.
