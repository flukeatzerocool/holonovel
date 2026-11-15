# Tasks — Identifier-derivation conformance

Dependency-ordered. Each task names its done-predicate. Check boxes as they close
(`docs/plans/README.md` step 4).

## Phase 1 — Baseline and spec

- [x] T1 Baseline. `npm run validate:sdd` un-piped; record error/warning counts.
      Done: `aar.md` carries the numbers.
- [x] T2 `REQ-659` in `spec/02-requirements.md` after `REQ-194b`; `_Check:_ T787`;
      reserved names cited from §7.1a, never enumerated.
      Done: header matches `**REQ-659 — Slug derivation.**`, one paragraph, ≤8
      sentences, ≤800 characters, no backticked list over five tokens.
- [x] T2a Appendix E manifest row `| REQ-659 | Slug derivation | 2026-11-14 |`
      after `REQ-658`. Done: `validate` resolves the REQ (no `undefinedReqs`).
- [x] T3 §5.1 map row gains `659` (`spec/02-requirements.md:9`).
      Done: `npm run validate` reports no section-map error.
- [x] T4 §7.1a cites `REQ-659`, "Consider:" → `SHALL`, reserved list stated.
      Done: `grep -n 'REQ-659' spec/04-runtime.md` resolves in §7.1a.
- [x] T5 §7.1 gains the identifier-token sentence.
      Done: §7.1 names the `set_active_state` case.
- [x] T6 Appendix F: new `T787` row after `T786`; `T236` row names the underscore
      assertion. Done: both rows present.

## Phase 2 — Code

- [x] T7 `holonovel/src/core/slug.ts` with `deriveSlug` (reserved-stem remap,
      `"novel"` fallback) and `fitSlug(slug, stateDir, ext)` returning a **slug**
      (hash prefix, truncate, re-trim); both `isSafeSlug`-clean, `REQ-659`
      header, and the fitted value is what `novel.slug` stores.
      Done: no `fs` import; both exported; `isSafeSlug(deriveSlug(x))` for
      `"CON"`, `"!!!"`, and a 300-character name.
- [x] T8 `anchors.ts` underscore branch with whitespace boundary.
      Done: a unit probe returns `the-door` for `_GM only_ The Door` and for
      `_GM only_, The Door` (comma boundary), and `setactivestate` unchanged for
      `set_active_state`.
- [x] T9 Wire the five derivation sites (`state.ts:1268`;
      `index.ts:2283,13561,13687,13714`).
      Done: each of the five lines (`state.ts:1268`,
      `index.ts:2283,13561,13687,13714`) no longer matches
      `toLowerCase().replace(/[^a-z0-9]` — other, unrelated occurrences in
      `index.ts` are out of scope.
- [x] T9a Admission boundary: **literal**-stem reserved refusal and the
      240-character refusal beside `isSafeSlug` (`index.ts:14249`), so `con-1`
      is admitted and `con` is refused.
      Done: round-trip case passes; enumeration over `holonovel/src` recorded in
      `aar.md`, each writer derived, fixed-content, or refusing.

## Phase 3 — Tests

- [x] T10 Extend `T236` (underscore, comma case, identifier regression) and add
      `T787` (reserved stems, trim, determinism, `"!!!"` fallback, `isSafeSlug`,
      240 ceiling, cross-directory fit, admission round-trip).
      Done: harness exits 0; both titles carry their IDs.
- [x] T11 Wiring cases: `create(name: "CON")` reports `con-1`;
      `rename(new_slug: "CON")` reports `con-1`; pack admission refuses a
      reserved or over-length slug with `[INVALID_INPUT]`.
      Done: all three assertions in the harness.
- [x] T12 Typecheck the server package. Done: `npm run typecheck` exits 0.

## Phase 4 — Bookkeeping, AAR, gates, close

- [x] T13 `npm run validate -- --write-register`; `REQ-659` evidenced.
      Done: register row is not bucket A.
- [x] T14 Dispose `F-U3-1`/`F-U3-2` `Resolved`, split the shared roadmap lead
      sentence, delete `ROADMAP.md:78-90`.
      Done: `npm run check-registers -- --strict` and `npm run check-roadmap`
      pass; `F-U3-3`/`F-U3-4` still cite the §7.3a roadmap section.
- [x] T15 `CHANGELOG.md` entry dated `2026-11-14`.
- [x] T16 `aar.md` ending `LOOP PAUSED`, gate block placeholder.
- [x] T17 Gates un-piped: `assemble` → `validate` → `check-registers --strict` →
      `check-roadmap` → `build-order` → `check:fast`.
      Done: `check:fast: PASS`, `validate` 0 errors, no new warnings.
- [x] T18 Amend `aar.md` with measured gate results.
- [x] T19 `npm run session:close` (one spec-touching commit). No push.
