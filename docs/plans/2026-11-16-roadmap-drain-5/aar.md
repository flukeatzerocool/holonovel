# After-action report — REQ evidence linkage chunk 4 (roadmap drain 5)

Covers `docs/plans/2026-11-16-roadmap-drain-5`: five linked rows closed, all 85 triaged, T497
deferred on measured evidence.

## What was supposed to happen

P1 an 85-row `dispositions.md` triage; P2 `T493`/`T682` closed by moving each report into a declared
`check*(): string[]` plus a spawnable `--root`; P3 `T541`/`T542` closed by authoring two harness
assertions; P4 corpus + coverage register + ROADMAP + register + CHANGELOG; P5 gates, AAR, one
commit. Done bar: `a+b+c=85`, five rows closed with a per-row probe at 0, `REQ evidence linkage:
80`, `check:fast` PASS, one commit, AAR at `LOOP PAUSED`.

## What happened

| Phase | Outcome |
|---|---|
| P1 | `dispositions.md` authored: 85 rows, 70 class-(b) + 15 class-(c), reusing chunk 3's gate-side classifications rather than re-reading every Appendix F row |
| P2 | `version-check.ts` — `checkVersionCurrency` declared, `--root` rebinds only `package.json`/`CHANGELOG.md`; `surface-replay.ts` — comparison extracted to `checkExpectedActionPrecision`, `T682` clause authored |
| P3 | `check-vendor-manifest.ts` — three path constants moved below parsing, `--root` added; `test-ruleset-gates.ts` — `T541` over a mirrored narrative tree, `T542` over temp `DECISIONS.md` |
| P4 | corpus 85 → 80 (five rows removed); coverage register shows only `Exercised tests` cells changed, buckets A0/B0/C493/D0/E117 unchanged; ROADMAP item 3 restated at 80; dated register subsection; CHANGELOG entry |
| P5 | `check:fast` PASS (46/46), `test:all` 56/56, AAR, one commit |

## Verification

| # | Command | Result |
|---|---|---|
| V1 | `npm run validate` (un-piped) | exit 0; `0 error(s), 385 warning(s)`; A0/B0/C493/D0/E117; `REQ evidence linkage: 80` |
| V2 | per-T-ID probe, `/tmp/c.md` → regenerated `corpus.md` | `T493` 1→0, `T682` 1→0, `T541` 2→0, `T542` 1→0, `T497` 8→8 |
| V3 | regenerate to `/tmp/c2.md` and diff | committed corpus is the regenerated file; diff against the baseline is the five closed rows only |
| V4 | `npm run test:spec-tooling` | 107 passed (five new version-check cases: stale, current, missing value, unknown flag, and the stale failure naming the currency predicate) |
| V5 | `npm run test:ruleset-gates`; `npm run test:all` | 25 passed (23 baseline + T541 + T542); suite 56/56 in 180.8 s |
| V6 | `npm run check:fast` | `46 passed, 0 failed`; `check:fast: PASS` |
| V7 | `npm run check-loop-artifacts`; D2-template count | 0 errors; 85 data rows; `(a) 0 + (b) 70 + (c) 15 = 85`; five rows action `closed` with home lines |

## Deviations from plan

- **`T541`'s red read was not captured pre-change.** The `--root` flag landed in the same edit as the
  test rather than after it. The case is discriminating post-change in both directions (clean
  `--strict` copy exits 0; tampered hash exits 1 with `MISMATCH`; URL-stripped manifest exits 1), but
  the plan's stated red-then-green order was not followed. Recorded in `tasks.md`.
- **`T541`'s fixture needed a directory mirror, not a manifest copy**, exactly as the sixth cold pass
  predicted; the manifest-only variant fails for missing files, which would have been a false red.
- **`T682`'s fallback was removed**, not merely documented: `?? prior?.visibility_rate` accepted a
  visibility-only baseline as recall evidence. The committed replay record carries
  `recall_at_budget` on all three profiles, so no gate turned red.
- **Execution followed six cold reviews** (all FAILED) under a recorded exception:
  `Risk accepted: no cold pass returned passed in 6 attempts; user authorized execution twice after
  being told the condition (C-1). Authorized by: fluke (user).`

## Finding triage

- **F1 (P0, process) — six cold passes, no passing token.** Each pass found real defects in the
  verification (a vacuous probe, an unreachable unit case, two impossible fixtures), so the passes
  paid for themselves; the cost was six review rounds on one plan. Disposition: resolved by
  execution; the lesson (price a verification seam before writing it into a plan) has no repo-side
  action.
- **F2 (P1) — the 80-row residue.** 65 class-(b) rows need authored assertions; 15 class-(c) rows
  describe builder drills. Disposition: `Scheduled-roadmap` — ROADMAP item 3 carries it with the
  measured split.
- **F3 (P1) — `T497`'s eight rows.** Deferred, not relabelled: their candidate tests assert other
  contracts. Disposition: `Scheduled-roadmap` — chunk 5 authors the assertion; the reason is on
  ROADMAP and in the register so the next increment cannot quietly label them.
- **F4 (P2) — `test:ruleset-gates` is absent from `test:all`.** The new `T541`/`T542` cases run only
  under their own npm script. Disposition: recorded; adding the gate to the suite would change the
  56-command contract and belongs to a suite-inventory increment, not this one.
- **F5 (P3) — `version-check.ts` runs in no local gate.** Guarded by the five new self-test cases and
  the CI currency step. Disposition: record-and-close.

## What went right

- The triage reused chunk 3's recorded classifications instead of re-deriving 85 rows, which kept the
  increment inside one session without weakening the record.
- The per-row probe did its job: it distinguished "five rows closed" from "the aggregate fell by
  five", which the six review rounds had singled out as the plan's weakest point.
- Deferring `T497` was the honest call. Labelling `T689` package-update tests with `T497` would have
  read as progress and left eight rows falsely evidenced; nothing in the ratchets would have noticed.

## What went wrong

- The `T541` work was written test-after-flag, against the plan's own ordering, so its red read is
  reconstructed rather than captured.
- The first `T541` fixture attempt failed twice for the reason the cold pass had already given me:
  the checker resolves rows against `narrative/`, so a manifest-only copy fails for missing files.
  The lesson was on the page and I still walked into it.

## Outcome vs done bar

Every item holds: 85 rows triaged with `a+b+c=85`, five rows closed with a probe at 0, `validate`
reporting `80` at 0 errors, `check:fast` green, `test:all` 56/56, one commit, this AAR. The residue
and the `T497` deferral are on ROADMAP with measured counts, so chunk 5 starts from evidence.

LOOP PAUSED
