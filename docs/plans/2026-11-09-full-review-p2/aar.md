# AAR — full-review sweep, chunk P2 (tool surface and §5.3)

**Date:** 2026-11-09 · **Scope:** chunk P2 (§5.3, 115 REQs), citation
resolution, register/roadmap write-back. **Plan:**
`docs/plans/2026-11-09-full-review-p2/plan.md` (sha256 `e89dfc70…`), reviewed
cold (1 blocker, 3 majors) and re-reviewed after the fixes.

## What happened

1. Baseline measured: tree clean at `a9b27a9`, `check:fast` 37/37 PASS,
   `npm run check` PASS, `test:tool-definitions` 17/17, `test:security` 12/12.
   No C0 was needed.
2. D1–D6 recorded; the 115 §5.3 REQs partitioned into seven clusters and the
   partition re-verified (A 21 · B 10 · C 13 · D 18 · E 19 · F 15 · G 19).
3. Code side reviewed against the cluster's carrying gates and the live
   artifact: 42 `registerTool` sites reconcile to 37 advertised tools (4
   retired tombstones + 1 dynamic loop), the DECISIONS per-tool justification
   table has 37 rows, `ui://` resources carry empty-origin CSP, and
   `spec_health` reports the REQ-408/413/414/415 surfaces.
4. Spec side resolved mechanically: 76 holds, 20 builder-side, 19 findings.
5. Four findings scheduled (three citation-repair, one harness-label), two
   roadmap items added, register rows written, sweep trigger advanced to
   chunk P3. No source file changed.

## What went right

- The plan's D3 (bucket inherited from the family row) was corrected by the
  cold pass before execution. Without it the session would have looked for 46
  bucket-D REQs that do not exist and probably invented a fourth verdict.
- The 42-vs-37 reconciliation was written into the plan before the review, so
  the site count never became a false P0.
- Running the two server-suite harnesses in Phase 0 turned a blind spot (green
  root gates, unexecuted TDQS assertions) into measured evidence.

## What went wrong

- The first citation pass produced 20 "findings" because zero-padded harness
  tokens (`T022`) matched real IDs. Normalizing them then produced a false
  hold on REQ-023b, because the `T022` test asserts something else entirely.
  The lesson: a literal token match is not evidence the cited behaviour is
  exercised; open the matching test.
- The plan's draft asserted the coverage register was per-REQ. It is
  per-family. Fixed at review, but the same error would have been cheap to
  catch by reading one register row before drafting.

## Findings and dispositions

| Finding | Disposition |
|---|---|
| F-P2-1 nine §5.3 REQs cite T22; REQ-023a/023b need the assertion, REQ-078a–078d need a re-point | `ROADMAP.md` § §5.3 citation repair (P1); register `Scheduled-roadmap` |
| F-P2-2 REQ-024a cites T35 (fixture isolation) with no harness | same roadmap section; register `Scheduled-roadmap` |
| F-P2-3 nine stale citations whose behaviour is exercised under another ID | same roadmap section; register `Scheduled-roadmap` |
| F-P2-4 zero-padded harness test IDs shadow real Appendix F IDs | `ROADMAP.md` § Harness test-ID label hygiene (P2); register `Scheduled-roadmap` |
| No P0 | — |

## Gates

`check:fast` 37/37 · `check` PASS · `test:tool-definitions` 17/17 ·
`test:security` 12/12 · `check-roadmap` PASS · `check-registers` PASS ·
`check-loop-artifacts` PASS · `build-order` clean.

## Next

Chunk P3 (mutation, decision, and lifecycle handlers against §5.4/§5.6). The
two citation-repair items and the harness-label item are independent of the
sweep and can run in any order.

LOOP PAUSED
