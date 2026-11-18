# Diff record — plan revision 2 → revision 3

Revision 3 is a text-only amendment resolving the diff re-review's three Nits and six Deferred
findings. No file list, gate, or destructive step changed.

Previous artifact sha256: `39518c94c75fda393baa76a4e40be89834110505ae0705560853225fcdeab955`

## Deferred (Major) — D8 probe 3 and the offset-miss message

- D2's unresolved-offset bullet now pins the stderr text:
  `offset target <path>:<target> does not carry '<symbol>' (anchor <source>:<path>:<recorded>)`.
- D8 probe 3 now names its setup edit ("first move a live anchor's recorded line off its carrying
  line, the same setup edit probes 1–2 use") and asserts the pinned text.
- tasks.md's probe-3 line matches.

## Deferred (Nits)

- "the two `includes()` self-checks" → "the single `includes()` test at
  `scripts/refresh-predicates.ts:140`" in D1 and P2 (only one site exists).
- Validation list gains a non-integer `--from-line` and the no-flag report-only default
  (`--offset` with neither `--check` nor `--write`).

## New Nits from the re-review

- N-1: `rejectUnknown`'s parameter is described as an optional, additive fourth argument with the
  four-argument signature shown.
- N-2: the fallback gate now reads "zero candidate lines — no `lineCarriesSymbol` match anywhere in
  it, which is D1's precondition", replacing "zero occurrences of the symbol".
- N-3: V1 states that a label groups one or more assertions (C1 three; C2/C4/C9 two to three; the
  rest one).
- Register pointer citation corrected from `:3140-3141` to `:3141-3142`.

## Header

Revision 2 → 3, and the review history records both cold passes and the amendment.
