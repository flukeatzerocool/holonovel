# Independent review — §5.20/§5.24 assertion repair (F-P5-7)

Reviewer: independent-review (five fresh `review` subagents across stages 1–5,
plus one Stage 5 re-audit)
Plan sha256: 1251b5f7ba45e869505c7a69e0a53c111379481f28dcf22b627c61c7a8ea4a39

## Verdict

`independent-review FAILED.` — Stage 5 was NO-GO on its first run and again on
the permitted re-audit. Every blocker and major from all stages was fixed in
the artifact after the finding; the third (and final allowed) readiness pass was
not run, so the fixes are cold-unverified. Escalated to the user.

## Stage results

| Stage | Reviewer | Result |
|---|---|---|
| 1 — zoom out | fresh | 2 Blockers, 15 Majors, 9 Nits (clarity) |
| 2 — comprehension | fresh | faithful; 3 Majors, 2 Nits |
| 3a — design | fresh | 1 Blocker, 6 Majors, 4 Nits |
| 3b — structural | fresh | 1 Blocker, 7 Majors, 5 Nits |
| 3c — style | fresh | 10 Majors, 10 Nits |
| 4 — re-zoom | fresh | 19/21 resolved; 1 new Major, 7 Nits |
| 5 — readiness | fresh | NO-GO: 2 Blockers, 6 Majors, 3 Nits |
| 5 — re-audit | fresh | NO-GO: 2 Blockers, 6 Majors, 3 Nits |

## What the cold pass changed

The six-assertion scope survived; the execution detail did not. The largest
corrections were mechanical:

1. **T640 is now seven `test()` cases, not one.** The harness aborts a case on
   the first failed assertion, so a single case could not produce the required
   per-case red evidence; the harness count moves 10 → 16.
2. **The T713 fixture gained its write step.** The first readiness run caught
   that the numbered procedure read and re-checksummed the save but never wrote
   it back — the fixture was a no-op.
3. **D5a was added.** REQ-603 forbids `verify` claiming clean while reporting
   unhashed entries; the widened T713 would have documented the violation, so
   the status composition changes and the unhashed-count assertion joins T713.
4. **The register group is deleted with its bullet.** F-P5-7 is the only body
   of its `### … chunk P5` group, so closing it would strand an empty heading.
5. **The pre-fix red run was reordered** (assertions → red → code) so no stash
   is needed and no step commits a fix-less tree.
6. **T550's path, T727's `select`/`reason`/export accessor, and the budget
   strings** are now named literals rather than inferences.

## Unknowns carried

- The T640 budget threshold is measured in Phase 1 (150 is the starting value;
  the case uses the first X that is red pre-fix).
- The manual-with-no-selection fallback is implementation behaviour, not a
  REQ-612 contract; D9(d) records the spec silence.
- Stage 5's isolation note: reviewer contexts received project `AGENTS.md`
  files that were not dispatched; findings were reached from the named paths.

## Stage reports

`cold/01-zoom.md`, `cold/02-comprehension.md`, `cold/03-critics.md`,
`cold/04-rezoom.md`, `cold/05-readiness.md`, `cold/00-scope.md`.
