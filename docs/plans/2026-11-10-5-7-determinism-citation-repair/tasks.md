# Tasks — §5.7 determinism and citation repair (F-P7a-1…-3)

Dependency-ordered. One commit at the end of the last slice reached (see
`plan.md` §6). `plan.md`, `tasks.md`, and `aar.md` must exist before the commit.

## 0. Preflight

- [ ] `npm run status`; `git fetch origin main`; record the base commit.
- [ ] `npm run check:fast` un-piped; record `check:fast: PASS`.
- [ ] Re-derive the caller-seed sites:
      `rg -n "args\.seed|SESSION_SEED" holonovel/src/index.ts holonovel/src/core/rng.ts`
      and reconcile `plan.md` §2 (the site set is the contract).
- [ ] Run `npm run check-registers` and record the rows that must move.
- [ ] Write `aar.md` opened with `LOOP OPEN`.

## 1. Slice A — seed-conflict warning (F-P7a-1)

- [ ] `core/rng.ts`: add `seedConflictWarning(perCallSeed)` — `null` unless a
      non-empty caller seed and `TTRPG_SEED !== undefined`.
- [ ] `index.ts`: append the line at all 10 sites — oracle, combat init,
      character create (ability-scores branch), `resolve_fate`,
      `resolve_ironsworn`, `resolve_forged`, ruleset `roll`, ruleset `table`,
      `manage_ruleset` action roll, world generate (`needInput` body).
- [ ] Confirm no line at the internally seeded sites (session-seeded
      `rollDice`, premise/context generation, hazard draw).
- [ ] `spec/02-requirements.md`: REQ-050a — replace "when a session seed is
      active" with "while `TTRPG_SEED` is set"; add `_Check:_ T27.` REQ-050c —
      `_Check:_ G2, T111.`
- [ ] `spec/appendices-reference.md`: T27 row = seeded draws + exact conflict
      line (REQ column `REQ-050, REQ-050a`); T111 row gains d6 witnesses and
      unset-seed two-restart (REQ column `REQ-050, REQ-050c`).
- [ ] `test-backfill.ts`: extend `T27/T111/T050` — ten-site conflict line,
      negatives, `[NEED_INPUT]` order, B.4 d6+d20 witnesses (42 and 7), stream
      position, two unseeded boots.
- [ ] `holonovel/DECISIONS.md`: rationale + startup-log discrepancy.
- [ ] `review-register.md`: F-P7a-1 → `## Resolved` with post-change
      predicate; remove its ROADMAP bullet.
- [ ] `npm run assemble`, `npm run validate -- --write-register`,
      `npm --prefix holonovel run test:backfill`,
      `npm --prefix holonovel run test:fate`, `test:ironsworn`, `test:forged`,
      `test:competitive-gaps`, `npm run check:fast`, `npm run check-registers`.

## 2. Slice B — REQ-052 citation (F-P7a-3)

- [ ] `spec/02-requirements.md`: REQ-052 `_Check:_ T739.`
- [ ] `spec/appendices-reference.md`: T20 row → adversarial free-text only,
      REQ column `REQ-054`; T739 row gains REQ-052.
- [ ] `test-backfill.ts:534`: retitle
      `T20/REQ-054: stored free text renders verbatim in world://map`
      (assertions unchanged).
- [ ] `review-register.md`: F-P7a-3 → `## Resolved`; split the citation
      bullet at `ROADMAP.md:20-22` — remove the REQ-052 clause, keep a bullet
      naming REQ-055/REQ-055a/REQ-055b.
- [ ] `npm run assemble`, `npm run validate -- --write-register`,
      `npm --prefix holonovel run test:backfill`, `npm run check:fast`,
      `npm run check-registers`.

## 3. Slice C — REQ-055 family evidence (F-P7a-2)

- [ ] `state.ts`: apply `initialBadgeFromEnv()` in `resumeNovel` and in
      `switchNovel`'s already-hydrated branch when the persisted badge is
      `"none"`; audit `env_badge_applied`; persist with `saveNovel`; amend the
      stale comment at `state.ts:652-653`. Idempotent by the `"none"` guard.
- [ ] `index.ts`: add `badgeDisplayLabel`; append `<Display> badge active.` to
      resume when the effective badge is not `"none"`.
- [ ] `test-persistence.ts`: add `T31` (isolation, roster copy, end, roster
      survives, ended resume refused).
- [ ] `test-persistence.ts`: add `T108` (GM wins over env; env applies to an
      unbadged Novel; per-Novel badge on switch; notice text).
- [ ] `test-persistence.ts`: header ID list gains T31 and T108.
- [ ] `spec/02-requirements.md`: REQ-055 `_Check:_ T9, T31, T98, T111.`;
      REQ-055a `_Check:_ T9, T108.`; REQ-055b `_Check:_ T108.`
- [ ] `spec/appendices-reference.md`: T108 description + REQ column
      `REQ-055a, REQ-055b`; T9 description gains the `TTRPG_BADGE`-seeded
      new-Novel clause and its REQ column gains `REQ-055a`.
- [ ] `holonovel/DECISIONS.md`: also record that an explicit Editor badge is
      overridden by `TTRPG_BADGE` on resume (indistinguishable from "never
      set").
- [ ] `review-register.md`: F-P7a-2 → `## Resolved`; remove the last ROADMAP
      bullet; delete the section.
- [ ] `npm run assemble`, `npm run validate -- --write-register`,
      `npm --prefix holonovel run test:persistence`, `test:limits`,
      `test:backfill`, `test:output-contracts`, `npm run check:fast`,
      `npm run check-registers`.

## 4. Close-out

- [ ] `CHANGELOG.md`: `## 2026-11-10` with one bullet per finding.
- [ ] `npm run build-order`; `npm run check:fast` un-piped.
- [ ] Run the three manual bar checks in `plan.md` §8.
- [ ] Rewrite `aar.md` with a disposition per finding and a terminal token.
- [ ] `npm run session:close`.
