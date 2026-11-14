# AAR — ruleset search badge scope (F-P1-17)

Increment: `docs/plans/2026-11-14-ruleset-search-badge-scope/`
Plan artifact: `plan.md` (sha256 `b58166c9…`, stamped `fresh`, standard depth)
Baseline `ddd0e48`: `check:fast` 41/41 · `test:ruleset-nonovel` 10 passed
Close: `test:all` 56 passed, 0 failed · `check:fast` PASS

## What happened

1. **T0** re-confirmed every predicate at HEAD. `RulesetSearch.search` had no
   visibility filter; the index reads were 3 call sites (5 occurrences) plus
   the `resource` read; `indexForReport` has 4 host readers; §5.2 is in neither
   fingerprint list. C-1 clear.
2. **T1/T2** added `RulesetIndexEntry.badge_scope?` and a `visible` predicate
   applied to both `search` return paths (blank query included), then composed
   `visibleIndexEntry` (scope **and** the legacy `category` refusal) through
   `searchIndexVisible`, and repointed the package search kind,
   `manage_ruleset (action: search)` (hits and total), and the `ruleset://`
   entry resource. The resource now answers `[NOT_FOUND]` instead of a
   scope-confirming `[FORBIDDEN]`.
3. **T3** parameterised the harness fixture into a default package and a legacy
   variant in the same data directory, and wrote T784 (Player, Observer,
   Editor, Game Master × both search surfaces × the resource, plus
   blank/whitespace and legacy legs).
4. **T4** added REQ-210d, the Appendix F T784 row, and the REQ index row;
   reassembled both spec copies.
5. **T5** moved F-P1-17 to `Resolved` (with predicates re-cited), deleted its
   scheduled bullet and the `ROADMAP.md` bullet, added the CHANGELOG entry, and
   regenerated the coverage register.
6. **T6** copied the stamped artifact into the tracked increment and wrote the
   task list and this report.

## What went right

- The plan's compatibility invariant caught the real hazard before it shipped:
  composing the legacy `category` signal instead of replacing it means no
  un-rebuilt package widens. T784.8 proves it.
- The cold pass found the blank-query bypass, which the plan's own tests would
  otherwise have missed: a Player could have read GM-only entries by sending an
  empty query. That leg is now permanent.
- Re-confirming predicates at HEAD before editing held: every cited line was
  still where the register said, and the ordinal remap after the edit was
  mechanical rather than forensic.

## What went wrong

1. **REQ-210d needed rewording to clear the proofreading pass.** The first body
   tripped a 61-word sentence and a four-conjunction sentence; it was split,
   landing at 719 characters / 5 sentences instead of the planned 711 / 4 (C-3).
2. **Two T784 legs were written against the wrong surface.** The package
   `search` tool schema has no `max_results`, so the `[n of m]` total had to be
   asserted through `manage_ruleset (action: search)`; and `"hidden gm thing"`
   is not an all-invisible query because the shared entries match `thing`. Both
   were caught by the harness on the first run and fixed in place.
3. **17 Holosuite evidence anchors drifted with the edit**, failing four tiers
   with `predicate_unresolved`. Repointed by symbol ordinal against
   `HEAD:holonovel/src/index.ts`; recorded as deviation 6 because the four
   anchor files were outside the plan's blast radius. This is the fifth manual
   repoint session and is exactly the `ROADMAP.md` § *Holosuite anchor repoint
   automation (P2)* trigger — that item stays scheduled and is the tracking
   surface, not a new recommendation.
4. **A ROADMAP edit was applied inverted on the first attempt** (the bullet was
   duplicated instead of deleted) and was corrected immediately; the tree was
   never committed in that state.

## Register and roadmap state

- F-P1-17 `Resolved`; `ROADMAP.md` § *Trust-core contract remediation (P1)*
  keeps its two remaining bullets (authorization; audit durability and badge
  truth).
- No new P0/P1. The anchor-drift recurrence is already scheduled as P2 and the
  `check-registers` warning for REQ-001b2 predates this increment.

## Action items

None new. The next increment comes from `ROADMAP.md` (the remaining bullets of
the same section) or a direct user request.

LOOP PAUSED
