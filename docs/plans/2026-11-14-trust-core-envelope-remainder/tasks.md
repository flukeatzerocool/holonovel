# Tasks — Trust-core error-envelope remainder

Ordered by dependency. Each task names the surface it touches and the check
that proves it done. Red first: no production edit lands before its assertion
fails for the named reason.

## T0 — Probe (no writes to the repo)

Scratch `TTRPG_DATA_DIR` under `/tmp/opencode`; a throwaway MCP client.

1. Call a returned-`err()` path (installed ruleset lookup with an unknown key).
   Record `isError` and `structuredContent`.
2. Call a tool with a structurally invalid argument. Record `isError` and
   whether `structuredContent` is present.
3. Boot with `TTRPG_PACING_WINDOW=3`; reset a scene, then issue a returned
   error and read the briefing for `[pacing]`.
4. Install the synthetic package from `test-ruleset-nonovel.ts` and record the
   Player-badge enumeration for an unknown `things` key.

Done when every shape is written into the plan's premise list (or an amendment
is recorded).

## T1 — Red assertions

1. `test-output-contracts.ts`: add T783 sweep; tighten G2; extend T180.
2. `test-narrative.ts`: T386c returned-`err()` leg.
3. `test-ruleset-nonovel.ts`: GM-only `things` entry + GM-only info entry +
   T179.
4. `test-backfill.ts`: drop the borrowed `T179` token from the truncation test.

Done when each new assertion fails for the reason it names, and the untouched
suite still passes.

## T2 — Helper-level `isError` (C1)

1. `err()` adds `isError: true`.
2. `raw()` adds `isError: true` when `classifyStatus` returns `ERROR`.
3. Delete `refusalResult`; route its three uses through `err()`; narrow
   `GuardRefusal`.
4. Refresh the two header comments.

Done when T636 and G2 pass and `test:output-contracts` is green.

## T3 — Pacing (C2)

1. Keep the `isError` guard in `paced`; refresh the comment.
2. Amend REQ-336a; record the post-edit char and sentence count.

Done when T386, T386b, and T386c pass.

## T4 — Ruleset visibility (C4)

1. Add `rulesetEntryVisible(entry, badge)`.
2. Apply it to the lookup collection copy (matching, enumeration, hint) and
   the info resolution scan. Do not touch `search` (F-P1-17, out of scope).
3. Fix the stale REQ-002c comment.

Done when T179 passes and `test-ruleset-nonovel` is green.

## T5 — SDK structural resolution (C3)

1. Scope REQ-548c to category-bearing tool-level errors.
2. T180 asserts `structuredContent === undefined`.

Done when T180 passes and `npm run validate` accepts the body.

## T6 — Spec enabling contract (C5)

1. Add REQ-210c after REQ-210b.
2. Name the declared field in REQ-002c1.
3. Add the §5 map row and the Appendix REQ index row.
4. Apply Appendix M; re-measure every edited body (≤800 chars, ≤8 sentences).

Done when `npm run assemble && npm run validate` reports no new errors.

## T7 — Full harness pass

1. `npm --prefix holonovel run test:all`.
2. Repoint every drifted Holosuite anchor; re-run until green.

## T8 — Registers, roadmap, coverage, changelog (C7)

1. Review register: F-P1-14/15/16 → `Resolved`, predicates recomputed at the
   current line, exercising test named; F-P1-17 added as `Scheduled-roadmap`.
2. ROADMAP: replace bullet 1 with the F-P1-17 bullet naming REQ-002c1 and
   REQ-445; keep bullets 2/3 and `**Trigger:**`.
3. `npm run validate -- --write-register`.
4. CHANGELOG dated entry.

Done when `check:registers`, `check:roadmap`, and `check:loop-artifacts` pass.

## T9 — Gates and close

1. `npm run assemble && npm run check:fast` → trailing `check:fast: PASS`.
2. `npm run check:conformance` (expected no change).
3. Write `aar.md`, ending in `LOOP PAUSED` or `LOOP OPEN`.
4. `npm run session:close`.

## Parallelism

T2 and T4 touch disjoint helpers but share `src/index.ts`; run them serially.
T5 and T6 are spec-only and can follow T4. T1 must precede T2–T4.
