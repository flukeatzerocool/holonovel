# Targeted delta review — plan revision 3

Artifact verified at `a963b522bbced1587be4990c565f1797014a78a169656d14720db6ec8a2c274c` (matched).

## Changed passages

| # | Passage | Status |
|---|---|---|
| 1 | D2 pinned offset-miss stderr text | PRESENT (plan.md:160) |
| 2 | D8 probe 3 names its setup edit | PRESENT (plan.md:265-267) |
| 3 | D8 probe 3 asserts the pinned text | PRESENT (plan.md:269) |
| 4 | tasks.md probe-3 line matches | not verifiable from plan.md (cross-file) |
| 5 | D1 "single `includes()` test at `refresh-predicates.ts:140`" | PRESENT (plan.md:120-121) |
| 6 | P2 same correction | PRESENT (plan.md:318-319) |
| 7 | Validation gains non-integer/non-positive `--from-line` | PRESENT (plan.md:178-179) |
| 8 | Validation gains no-flag report-only default | PRESENT (plan.md:180-181) |
| 9 | N-1 `rejectUnknown` as an optional **fourth** argument | **MISSING** — "an optional third parameter" (plan.md:198) contradicted the four-argument signature |
| 10 | N-2 fallback gate "zero candidate lines — no `lineCarriesSymbol` match" | PRESENT (plan.md:172) |
| 11 | N-3 V1 states a label groups one or more assertions | PRESENT (plan.md:349) — see the Major |
| 12 | Register pointer corrected to `:3141-3142` | PRESENT (plan.md:245) |
| 13 | Header carries Revision 3 and the amendment history | PRESENT (plan.md:3, :32-38) |

## Major

**Major [clarity · design] — V1's per-label grouping cannot sum to the stated total.** V1 said
`44 passed` = *8 unit + 36 CLI assertions*, and the added gloss said "C1 is the existing
three-assertion case, C2/C4/C9 group two to three, the rest one". With 24 labels that yields 29–32
assertions, not 44: the gloss omitted the 11 assertions of the four pre-existing `repath:` cases.
A builder following the line literally would write too few assertions and red V1 and the Done bar.

Required change: state the real per-label grouping that sums to 36 CLI assertions, or drop the
counts and keep only "a label groups one or more assertions" with 44 as the single hard number.

## Non-blocking

- Nit: plan.md:198,262 — the N-1 correction did not land; "third parameter" contradicted the
  four-argument signature.
- Nit: probe 3's causality was not entailed — `recorded + 5` can land on another carrying line
  (dense `err`), in which case the probe writes rather than refusing. Achievable by anchor
  selection, but the causality should read as a selection requirement. The quoted string is also a
  prefix of D2's pinned text, not a byte-for-byte assertion of it.
- Deferred (unchanged text, out of scope): P3 still said "zero occurrences of the symbol" — the
  wording N-2 rejected in D2 — and the probe asserted `no anchor records path`, which D2 did not
  pin.

## Unknowns

- The `tasks.md` probe-3 claim was not read (path not supplied; budget).
- `rejectUnknown`'s arity was not re-read; the ordinal judgement rests on the plan's own citation
  and signature.
- The evidence sidecar and the register were not read.

**Reads used:** 4 / 5.

```
independent-review FAILED.

Plan sha256: a963b522bbced1587be4990c565f1797014a78a169656d14720db6ec8a2c274c
```

## Parent resolution (revision 4)

1. **Major** — V1 now states the full arithmetic: 8 unit (one each) + 25 C-labelled CLI (C1 3,
   C2 3, C3 2, C4 2, C5 1, C6 1, C7 1, C8 1, C9 2, C10 1, C11 1, C12 2, C13 1, C14 1, C15 1,
   C16 2) + the 11 assertions of the four pre-existing `repath:` cases = 44; the blast-radius row
   carries the same split.
2. **Nit** — `rejectUnknown` reads "optional fourth parameter" again.
3. **Nit** — D8 probe 3 requires the offset to be chosen so the shifted line is non-carrying
   (measure the candidate set first) and quotes the full pinned message.
4. **Deferred** — P3 reads "carries no candidate line for the symbol"; D2 pins
   `no anchor records path <p>; --path must name a path an anchor actually records`.
