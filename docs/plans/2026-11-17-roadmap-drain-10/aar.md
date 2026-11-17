# AAR — Roadmap drain 10 (REQ evidence linkage chunk 9, cross-artifact agreement)

## What was supposed to happen

The plan (`plan.md`, stamped revision 4) claimed three class-(b) rows would gain real asserting
sites, each a comparison between two committed artifacts that no gate cross-checked: `T205`
(REQ-082b) through a new `checkBriefingTokenRegistry` over the DECISIONS.md token table and the
runtime briefing registry, `T297` (REQ-277) through a new `checkFixtureWitness` that re-derives
the Appendix B.4 generator, and `T106` (REQ-107b) through a new `checkVersionCoordination` in
`version-check.ts` adding the CalVer-shape clause. Each assertion was to be proven by a negative
probe, the registers restated at 47, and `check:fast` green.

## What happened

All three rows landed and the residue moved 50 → 47 (`npm run validate` prints
`REQ evidence linkage: 47 finding(s)`, `0 error(s)`). All three checks were green on the pre-edit
tree, as the dry run predicted: the DECISIONS table and the runtime registry agree in set, order,
and numbering (40 = 39 + 1, contiguous 1..40); all 80 witness faces and all three seed-pinned
transcript arrays reproduce the LCG; and the root CalVer `2026.11.16` satisfies the dated grammar
and the DECISIONS §2 row.

The checks are error-level and read committed text only. `checkBriefingTokenRegistry` reads
`holonovel/DECISIONS.md` and `holonovel/src/index.ts`, marker-bounded on
`BRIEFING_SECTIONS` / `BRIEFING_VIEW_TOKENS` / `BRIEFING_BY_TOKEN`, and fails loud when a marker
or `narrative_threads` is absent (the view token is inserted only after that section, so an
unconditional comparison could pass against a set the server never builds).
`checkFixtureWitness` reads the assembled spec, implements the documented 32-bit LCG directly,
parses the B.4 and N.4 tables by their die-naming headers, and binds each transcript array to its
nearest preceding `"seed": N`. `checkVersionCoordination` adds the CalVer grammar, a real-calendar
-date check, and the DECISIONS §2 equality beside the existing `T493` currency check.

## Verification

| # | Command | Reading |
|---|---|---|
| V1 | `npm run validate` | exit 0; `0 error(s), 352 warning(s)`; `REQ evidence linkage: 47 finding(s)` |
| V2 | probes (5) | `T205` on a retokened DECISIONS row; `T297` on a mutated B.4 face and on a mutated B.3 die (each through `npm run assemble`, restored, `git diff --stat holonovel.md` empty); `T106` on a DECISIONS version row and on the CalVer shape `2026.11.6`; all restored |
| V3 | `npm run check:fast` (un-piped) | exit 0; `46 passed, 0 failed`; trailing `check:fast: PASS` |
| V4 | `wc -l`; `grep -c '^| REQ-'` on the corpus | `49`; `47` |
| V5 | item-3 bullets; corpus `grep -c` for the three T-IDs | `3`; `0` |
| V6 | `check-registers`; `check-roadmap` | PASS; `OK … (6 section(s))` |
| V7 | `npm run assemble`; `git diff --stat holonovel.md` | empty (no spec source edited) |
| V8 | `git diff --numstat -- holonovel/scripts` | empty (anchor delta 0; roadmap item 4 untriggered) |
| V9 | `npx tsx scripts/version-check.ts` | FAIL set unchanged: `T493` currency only, no `T106` line |
| — | `tsc --noEmit`; `test:validators`; `test:script-tooling` | clean; `79 passed`; `39 passed` |

## Deviations

1. **P2 and P3 landed in one edit of `scripts/validate.ts`.** Both functions were inserted in a
   single write, so the planned intermediate reading (`49 findings` after `T205`) was never
   observed; the step attribution comes from the five probes and the final `47`, not from the
   intermediate counts. No correctness cost: each function's failure path is proven independently
   by its own probe.
2. **A column-offset defect in `checkFixtureWitness` was caught by the first run and fixed before
   acceptance.** The header parse sliced the seed column twice, so the B.4 d6 data was compared
   against d20 draws and the N.4 d20 column was silently skipped — two `T297` errors on a clean
   tree. Fixed by iterating every post-seed header cell; the re-run passes and the probe proves
   the checks still fire. The defect is recorded because a silent-skip is exactly the failure mode
   the "pinned predicate" rule exists to prevent, and the plan's own fail-loud clause is what
   surfaced it.
3. **V9 and P4 were amended before the first edit.** `npx tsx scripts/version-check.ts` exits 1 on
   the untouched tree at the pre-existing `T493` currency line; the plan had assumed a green
   baseline. The delta amendment replaces "exit 0" with "FAIL set unchanged", which is stricter
   for this increment. Recorded in `plan.md` and re-stamped.
4. **The pre-existing `T493` failure was fixed in-session as its own commit**, after the increment
   commit: the root CalVer was one day behind the `2026-11-17` CHANGELOG heading, so CI's
   version-currency step would fail on push. `npm run version-bump` advanced the five surfaces
   together (REQ-107a). It is a baseline fix, not part of this increment.

## Findings and dispositions

- **`T205`/`T297` partial-clause claims.** Each label claims the clauses its check asserts; the
  live-server drill (`T205` sentence 2), the group-name canon, the ordering rationale, the
  maintainer's version-bump/changelog-comment actions (`T297` sentences 1–2), and the single-die
  `rolled 2` roll are recorded as unclaimed in `dispositions.md`. No new action — the remaining
  residue is tracked on `ROADMAP.md` item 3.
- **`T493` version currency (P0, fixed).** Demonstrated gate failure, not this increment's.
  Disposition: fixed in-session by `npm run version-bump` (revision `2026.11.17`), its own commit.
- **Cold-pass defects (revision 1; revision 2 Majors and Nit).** Three Blockers and five Majors
  in the first revision, two Majors and one Nit in the re-review — all resolved before execution
  and recorded in `plan.cold/`. They were this increment's own design defects; no roadmap entry.
- **No new action items.** The 47 remaining rows are tracked on `ROADMAP.md` item 3; roadmap items
  1, 2, 4, and 5 remain trigger-gated or operator-bound.

## Changelog entry

**Title:** Linkage chunk 9: three cross-artifact agreement checks, residue 50 → 47

**Summary:** Chunk 9 gave three class-(b) rows real asserting sites by cross-checking artifacts that shipped side by side but were never compared. `T205` asserts the DECISIONS.md briefing token table against the runtime registry in order, numbering, and set; `T297` re-derives the Appendix B.4 generator and checks the witness tables plus the transcript's seed-pinned dice; `T106` adds the CalVer-shape clause to the version check. The residue falls 50 → 47.

- `scripts/validate.ts`: `checkBriefingTokenRegistry` compares the 40-row DECISIONS.md token table with `BRIEFING_SECTIONS` + the conditional `BRIEFING_VIEW_TOKENS` insertion, and asserts the `[INVALID_INPUT]` rejection enumerates the same identifier; `checkFixtureWitness` implements the documented 32-bit LCG, parses the B.4/N.4 tables by their die headers, and binds B.3 transcript arrays to their nearest preceding seed
- `scripts/version-check.ts`: `checkVersionCoordination` adds the CalVer date-stamp grammar, a real-calendar-date check, and the DECISIONS §2 equality, beside the untouched `T493` currency check
- Five negative probes prove each assertion fires: a retokened DECISIONS row, a mutated witness face and transcript die (each through `npm run assemble`), and both a DECISIONS version row and the CalVer shape
- Residue 50 → 47; corpus 49 lines; three evidence cells move in the coverage register with no bucket change; `ROADMAP.md` item 3 restated at 47 and the review register gains the chunk-9 subsection

LOOP PAUSED
