# Stage 3 — critics (design, structural, style)

Plan sha256 on dispatch: f279474713a8d7fd02828adc2ab5fab2a12cb50a66fd9f2581298361c98d6ab2
Each critic ran in a fresh context with its own ≤10-read budget.

## Design — STAGE3-DESIGN PASS (0 Blockers, 5 Majors, 6 Nits)

- D3-1 [Major] C-13's cited skip-path does not exist: `:1180` skips an unparsed
  *pattern row*, `:1184-1188` **errors** on an unresolvable *coupling-row*
  token, and no predicate tests pattern-rule tuples against `VALID_ARCHETYPES`
  (the only vocabulary check is the §7.7 table's warning at `:1090`). C-13's
  conclusion is stronger than the plan claimed, but the reason and the step-8
  predicate were wrong.
- D3-2 [Major] `checkCouplingDerivation` does not exist; the function is
  `checkCouplingCompleteness` (`scripts/validate.ts:1049`).
- D3-3 [Major] Appendix T's `REQ-369`/`REQ-370` cells are unsuffixed; the plan
  must settle whether they are dead citations inside the atomic set.
- D3-4 [Major] The severity rubric can classify one finding as both P0 and P1;
  tie the class to the fix surface.
- D3-5 [Major] `builder-side` relaxes the chunk's exit evidence without
  recording the relaxation.
- Nits: EV12's predicate did not state its `holonovel/` exclusion; D5 overstated
  the boundary conflict; one row for 13 appendix clauses; the staged gate run is
  vacuous; the AAR-ordering citation does not say what it is cited for; the
  review.md mapping table duplicates the plan's.

## Structural — STAGE3-STRUCT FAIL (0 Blockers, 4 Majors, 8 Nits)

- S3-1 [Major] The "staged fix set" gate cannot fail: nothing stages before
  step 19.
- S3-2 [Major] P2 has no terminal disposition; `LOOP PAUSED` is unreachable for
  an unbounded P2.
- S3-3 [Major] The baseline (`validate:sdd`) and the re-check (`validate`) are
  different passes; the `build-order`-skipped branch never meets a full-mode
  proofreading run.
- S3-4 [Major] The authoritative done bar omitted the `worklist.md:167-168`
  amendment the steps mandate.
- Nits: P1–P8 vs severity vs pattern-rule ambiguity; `tasks.md` unowned; two
  cold-artifact paths; branch-inconsistent "confirmation" annotation; version
  row condition incomplete; no pre-declared split fence.

## Style — STAGE3-STYLE FAIL (1 Blocker, 6 Majors, 5 Nits)

- ST1 [Blocker, clarity] The independence field ("no formal cold pass") contradicts
  the status line and the "Resolutions (cold Stages 1–2)" heading.
- ST2 [Major] The "3 Majors + 10 Nits" count disagrees with the 3 + 7 ledger.
- ST3 [Major] A third Resolutions section sits inside the phase list.
- ST4 [Major] `checkCouplingDerivation` does not exist (duplicate of D3-2).
- ST5 [Major] A residual "five surfaces" survived in Open questions.
- ST6 [Major] "six gate consumers" is not enumerable from the table.
- ST7 [Major] `P<n>` carries three meanings; `D6` two.
- Nits: stale `:152-167`; 756 vs 754; the `world` merge predicate unstated;
  one enforcement row without a manifest range; bare `:line` anchors.
