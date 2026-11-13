# AAR — pre-existing harness failures: divergence probe and license refusal

Status: complete. Plan: `plan.md` · Tasks: `tasks.md`

## What happened

Executed the first open P1 roadmap item: the two HEAD-red harness assertions.
No plan steps were skipped; two plan corrections came from the delta re-review
before execution.

1. **H-1** — `checkRecord` now evaluates `samePolarity` and `opposite` over the
   event-anchored fact subset when the record cites an ordinal and that subset
   is non-empty. Appendix O.13 records the precedence. T752 gained a block
   asserting the `displaced-outcome` verdict cites event 1.
2. **H-2** — the share license gate moved from the embedded payload to a new
   `shareLicenseRefusal(novel)` that reads `novel.adventure_slug`; a
   generated-only share no longer writes `[license-unattributed]`. T740 gained
   a block asserting that silence.
3. **H-3** — recorded as `Closed-P3` (both-active share embeds the generated
   payload although the manifest names the loaded module); no action.

## What went right

- Red-first held: both new blocks failed on HEAD exactly as predicted, then
  passed with one implementation change each.
- The cold pass caught a real plan error (M-6): the audit warning was **not**
  misnamed `generated` — `embedded.slug` falls back to `novel.adventure_slug`
  (`index.ts:12366`), so the planned T740 audit-slug assertion would have
  passed on HEAD. It was replaced with the generated-only-silence assertion,
  which is genuinely red on HEAD.
- D1's scope was pinned by re-reading the fixture against the projection: only
  the `displaced-outcome` probe changes verdict; T779/T780's window path is
  untouched because its question set has no anchored fact.

## What went wrong

- The draft plan carried two count errors and one predicate error (M-4, M-5,
  M-6) that only the cold pass caught. Counts and attributed strings should be
  re-derived from the live code at draft time, not inferred from the asserted
  symptom.
- The first delta review reported two new Majors (M-6, M-7) after the re-review
  budget was consumed; they were fixed as in-scope factual corrections and
  recorded as condition C-2 rather than a third pass.

## Verification summary

| Check | Result |
|---|---|
| `npm --prefix holonovel run test:memory-recall` | 21 passed, 0 failed (was 19/1) |
| `npm --prefix holonovel run test:limits` | 28 passed, 0 failed (was 26/1) |
| `npm --prefix holonovel run test:belief` | 29 passed, 0 failed |
| `npm --prefix holonovel run test:adventure` | 27 passed, 0 failed |
| `npm run typecheck` | exit 0 |
| `npm run assemble && npm run check:fast` | exit 0, 41 passed, trailing PASS |

## Findings

- H-1, H-2 → `Resolved`; H-3 → `Closed-P3` (review register).
- **H-4 (found mid-execution, P0, scheduled):** `parseAppendices`
  (`scripts/assemble.ts`) discards any continuation block after an
  intra-appendix `---` separator, so `holonovel.md` has never carried Appendix
  O.8–O.13 (verified: `git show HEAD:holonovel.md | grep "Outcome opposition
  pairs"` is empty). This means the O.13 precedence line added by D2 is
  authoritative in `spec/` but does not reach the assembled artifact until the
  assembler is fixed. Fixing it would add previously undelivered sections to
  the published spec and was outside the approved plan, so it is recorded in
  the review register (`Scheduled-roadmap`) and on `ROADMAP.md` as a P0 item.
- Roadmap section removed; CHANGELOG entry added.

## What went right (continued)

- H-4 was caught only because the O.13 edit was verified in the assembled
  output; the check `grep holonovel.md` should be part of any appendix edit.

## Action items

One scheduled finding beyond this increment: H-4 (assembler gap), tracked on
ROADMAP.md. No other action items. The next plan comes from ROADMAP.md (H-4,
then §5.6 clock and combat-report remediation) or a direct request.

LOOP PAUSED
