# After-action report — Full-review sweep, chunk P7b

Status: complete · Plan: `plan.md` · Tasks: `tasks.md`
Plan gate: `plan-review passed.` (fresh cold pass + targeted diff re-review)

## What happened

1. **Cold review.** A fresh reviewer with no authoring context audited the
   plan: it confirmed the measured counts (58/37, 131/39, 189/76, 32 C / 44 E),
   the disjoint-and-complete five-cluster partition, and every cited anchor and
   gate name. It raised 0 blockers and 3 majors — blast-radius regeneration
   surfaces, an unspecified deferral-halt token, and a Phase 0 order that could
   turn the increment's own missing records into a false C0 — plus eleven minor
   findings. All were applied, then a targeted diff re-review passed with seven
   follow-up items, all of which were also applied.
2. **Baseline.** `check:fast` 37/37 PASS, `check` PASS, `test:all` 56/56 PASS
   (134 s). No C0 commit was needed.
3. **Review.** All 189 REQs across five clusters were dispositioned: 32 bucket C
   rows as `holds` except those carrying a finding, 44 bucket E rows as
   `builder-side` (one, REQ-214's family, carries a P2 finding). Sixteen
   behaviour rows were anchored to `file:line` and to the harness that carries
   them.
4. **Citation resolution.** The derivation matches the repo's own evidence
   model (`scripts/compare-spec-code.ts:150-166`): an `Automated` token is
   exercised only when it appears in a `test("...")` title under
   `holonovel/scripts`. Nine findings were raised — six P1, three P2 — all
   covering implemented behaviour whose cited test has no harness.
5. **Landing.** Findings were written to `spec/audit/review-register.md` under
   `## Scheduled-roadmap`, a §5.2/§5.8 assertion-repair section was added to
   `ROADMAP.md`, the sweep section now names chunk P8 and the closing M1 re-run,
   and the CHANGELOG carries a dated heading.

## What went right

- The cold pass paid for itself: it caught that Phase 0's gate run would fail on
  the increment's own missing `tasks.md`/`aar.md` and that the plan had no rule
  distinguishing that from a real C0 defect — the exact failure P7a recorded as
  D89 without fixing.
- Verifying the token→harness derivation against `compare-spec-code.ts` before
  trusting a stale-citation count prevented over-filing: most §5.2 rows are
  legitimately builder-side, and their cited tests describe build-time work, not
  missing harnesses.
- The 44 bucket-E rows made the §5.2 half cheap, as Q1 predicted: the section
  produced one finding, not thirty-seven.

## What went wrong

- The first cold reviewer could not write its report (its stage contract forbids
  file creation), so the parent persisted the report from the returned body. The
  hash was recorded against that persisted copy; the artifact is faithful but
  the review and the file write were split across contexts.
- The reviewer ran roughly 54 reads against a 40-call standard budget; the
  overrun is disclosed in its report.
- No P0 existed, so the in-session assertion path was exercised only in
  principle. The P1 findings are all citation repairs; none demonstrates wrong
  runtime output, and none was fixed in-session by design (Q2).

## Recommendations

- None new beyond the scheduled findings. F-P7b-1–F-P7b-9 are tracked by the
  §5.2/§5.8 assertion repair section; chunk P8 is the next sweep item.
- A future remediation session should prefer adding one assertion per finding
  family rather than per REQ, since each finding groups a family whose cited
  test was never implemented.

## Verification

- `npm run assemble` → exit 0
- `npm run check:fast` → `check:fast: PASS` (37/37)
- `npm run check` → `check: PASS`
- `npm --prefix holonovel run test:all` → 56/56 PASS
- `npm run check-registers:strict` → PASS
- `npm run check-roadmap` → PASS
- `npm run check-loop-artifacts` → PASS
- `npm run build-order` → PASS (fingerprint/marker refresh; version no-op)

## Loop status

`LOOP PAUSED`
