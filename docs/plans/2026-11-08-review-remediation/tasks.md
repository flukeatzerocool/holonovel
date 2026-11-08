# Tasks — Review remediation: memory, identity, and evidence anchors

Baseline: `check:fast` PASS 37/37; `test:all` **49 passed / 5 failed** at
`8099cbb` (18 `predicate_unresolved` findings). Plan:
`docs/plans/2026-11-08-review-remediation/plan.md` (revision 1 + delta
amendment 1).

## C0 — Restore the green baseline (done)

- [x] T1 Audit every Holosuite `anchor(...)`; 18 unresolved / 3 wrong-symbol
      cited imports or map entries.
- [x] T2 Re-point all 23 anchors to the implementing handler/function line.
- [x] T3 `test:all` → 54 passed, 0 failed.
- [x] T4 Commit `0359b5c`.

## C1 — Review remediation: memory, identity, and spec (done)

- [x] T5 CR-1 Player `open` brief prints gist, claim, affect.
- [x] T6 CR-2/CR-8 marker suffix out of the cost path; budget is a ceiling.
- [x] T7 CR-3 false outcome precedes displaced.
- [x] T8 CR-4 recap slots reserved for consolidation summaries.
- [x] T9 CR-5 fold survives undo and checkpoint restore.
- [x] T10 CR-6 scan matrix + REQ-599b amendment.
- [x] T11 CR-7 branch filter + REQ-458 amendment.
- [x] T12 CR-9/CR-13/CR-16 `configInt`, ordinal validation, entity resolution.
- [x] T13 CR-10/CR-11/CR-14 global catalog sort, load clamp, defensive spread.
- [x] T14 CR-12 whole-token O.13 lexicon.
- [x] T15 CR-15 alias index built once.
- [x] T16 CR-17/CR-18 §7.6 `0 = unlimited`; §7.7.0 class contract;
      REQ-240a/241a/334b.
- [x] T17 CR-19 read the O.12 floor from the assembled spec.
- [x] T18 CR-20 deterministic legacy ids.
- [x] T19 Tests/fixtures: T743/T744/T746/T749/T755/T757/T758/T761/T767/T768/
      T769/T770 extended; two pure probes added.
- [x] T20 `build-order` → Ready to commit; `check:fast` 37/37; `test:all` 54/54.
- [x] T21 Commit `12efa65`.

## C2 — Stricter predicate validation (done)

- [x] T22 `unresolvedPredicates` validates every recorded event predicate.
- [x] T23 Self-test proves a stale record-event predicate is reported.
- [x] T24 Five Holosuite tiers PASS; `test:all` 54/54; `check:fast` 37/37.
- [x] T25 Commit `115b8e5`.

## C3 — License-compliance docs repair (done)

- [x] T26 CR-21 repair plan/tasks/AAR prose; reproducible purge evidence.
- [x] T27 `check:fast` 37/37.
- [x] T28 Registers: review register CR-1..CR-22; `req-coverage` current.
- [x] T29 DECISIONS D1–D12; CHANGELOG entry; AAR.
- [x] T30 Commit.
