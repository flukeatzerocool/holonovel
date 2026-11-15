# Cold review — final plan bytes (v3)

Plan sha256: 2ca371465532727e91bc6536b16b16e9a157692adda741d578beb630563397e5

Reviewer: `review` subagent `ses_e1e612d51ffejiPsYwPtuC8ebz`, cold (no authoring context).
Scope: the artifact's current bytes, focused on the five claims added since the previous pass.
Reads used: 11 of 20. Stages: 1, 2, 3, 5 (stage 4 not triggered).

## Findings

**[Major] [clarity] — Scope 2's `--json` envelope field has no implementation step, yet V2 asserts
it.** Scope 2 requires the four row fields *and* "the `--json` envelope also gains the `writable`
name list" (plan.md:86); outline step 3 adds only the four row fields (plan.md:208-209) and never
mentions the envelope key, which V2 then asserts (plan.md:244). Same defect shape as M2 from the
first pass. Mitigating: the working tree already implements it (`scripts/gate-cost-report.ts:162`),
so the residual risk is traceability, not a missing feature.

**[Minor] [clarity] — the cold-artifact move is half-applied.** The durable path is real and
correctly cited in the header (plan.md:12-14), but the Amendments header still presents the cold
pass as `/tmp/opencode/cold-review-gate-retirement.md` (plan.md:311), contradicting the v3 bullet
(plan.md:351-353). The durable path is right.

**[Minor] [design] — the eighth test case names a predicate weaker than the claim.** 
`manifestGateNames(gates)` is a `Set` builder; asserting membership for `playability` is close to
tautological and would still pass if the `buildRows` filter were deleted. The module already
expresses the claim directly: `candidateReason` accepts `gate: … | undefined` and returns
`{ candidate: false, reason: "not in the manifest" }` (`scripts/lib/gate-retirement.ts:67`), a
branch the plan's reason catalogue omits. Either name that reason in step 2 and test it, or state
that the filter is verified only by V4.

**[Nit] — status and review lineage read stale after v3.** Line 3 still says "Status: draft v2";
the Review-independence block counts one cold pass plus one re-review and does not represent this
constrained third pass; `plan.cold/review.md` (the diff re-review artifact) is never cited by path.

**[Nit] — V10's replay instructions omit two facts.** A fresh worktree has no `.holonovel-state/`,
so the copy step needs `mkdir -p` first; `git worktree add /tmp/opencode/replay-gr` fails if the
path already exists. Both halves should read the same copied log.

## Claim answers

1. **Sound and discriminating.** The old report writes every candidate after the protected filter;
   the new code returns before any write when `writable.length === 0`
   (`scripts/gate-cost-report.ts:189-193`). Same log, threshold, and protected set, so the only
   behavioural change is the cover requirement. The 36 is safe because `playability` has 6 rows,
   far under threshold.
2. **Sound.** `writable: []` is telemetry-independent; the 36 is correctly demoted to
   corroboration, matching V2 and Done bar 1.
3. **Not fully consistent** — see the Major.
4. **Sufficient only for the predicate, not the filter** — see the Minor.
5. **Durable path confirmed.**

## Unknowns

- The live 36-candidate count and wall-clock figures were not recomputed (read-only shell).
- The working tree already contains the uncommitted implementation, so repo spot-checks show the
  target state rather than `675daeb`; plan citations were resolved with `git show`.

independent-review passed.
