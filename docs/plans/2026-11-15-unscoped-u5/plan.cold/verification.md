# Targeted verification — U5 plan v3

Reviewer: independent-review (fresh child context) · Reads: 7/12
Scope: the eight findings in `re-review.md`, verified mechanically.

Verdict: `independent-review passed.`

1. FIXED — 118 = 46+23+24+25 at `plan.md:82` and `:134-135`; no stale figure.
2. FIXED — the three doc rows are blast-radius entries at `:399-401` and are
   excluded from the predicate list at `:420-422`.
3. FIXED — nine code rows plus three doc rows reconcile 46 = 34 + 12.
4. FIXED — `spec/07-independent.md` has ten steps (step 10 at `:98`); the plan
   names steps 1–10.
5. FIXED — the report format is eight fields (`:111-118`).
6. FIXED — "every content line", with §10's boundaries covering `:1-11`.
7. FIXED — four fixture files plus one unit spanning two testdata directories.
8. FIXED — nine catalog gates listed and restated as nine.

Phase 1 table sums to 46 and the total line agrees.

Incidental: `plan.md:429-430` carried a garbled clause introduced by the R-3
edit ("any of the nine that is them that needs"); fixed after this pass, and the
fix is a deletion of duplicated words in a sentence whose predicate the pass
already verified. Recorded here so the build marker's evidence line is honest.

## Delta after the verified text (execution amendments)

Plan sha256: e2102d4d290af5e443212ed65a4cf7e0a73bb40a8a9e73c4252b09cd24126aca

This pass verified the plan at `446a3b4b…`. Three execution amendments landed
after it, and one blast-radius row, all recorded in the plan's § Execution
amendments:

- A-1 adds `holonovel/src/generated/g7-attestation.ts` to the blast radius and
  records that its `SPEC_HASH` covers the whole assembled spec. Verified by the
  gate that caught it (`check-g7-attestation` failed, regeneration changed one
  line) and by `git diff --stat` = 1 insertion, 1 deletion.
- A-2 corrects the Phase 0 commit measurement (`--since=2026-11-15` returns zero
  on this offset; `--since=2026-11-14T23:59:59` returns 11). The conclusion —
  trigger unmet — is unchanged.
- A-3 widens R25 to cover Appendix V's lead-in; the row count stays 46 because
  `grep -c '^| R[0-9]' review.md` returns 46.
- The amendments section itself is prose; it alters no step, no bar, and no file
  contract beyond the blast-radius row A-1 names.

Self-reviewed: the delta adds one file to a table and three factual notes, all
verified by commands already run in the increment.
