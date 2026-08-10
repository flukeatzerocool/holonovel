## 10. Independent Verification

_This section binds the operator's review process. It is not part of the Definition of
Done and adds no requirements on the builder. Its presence alone disciplines the build._

Independent verification breaks the last self-grading link: a second AI — the **verifier**
— re-executes the full verification workflow suite from a cold checkout and compares its results against
the recorded evidence.

The operator:

1. Confirms the handoff verification workflow (§9) has passed; collects the four artifacts.
2. Copies the artifacts to a clean directory and redacts DECISIONS.md's item (6)
   (6) verification workflow evidence (replaced with a withheld marker).
3. Launches a fresh agent session — a different model from the builder — with the clean
   directory, this document, and the verifier prompt below.
4. When the verifier completes Phase 1, supplies the unredacted DECISIONS.md for Phase 2.
5. Receives the report; adjudicates any `DISPUTED` items.

**Verifier prompt** (verbatim):

```
You are the verifier for a completed TTRPG MCP server build; you have no prior knowledge
of the build. Load these parts of the build specification first: Sections 1, 3, 7, 8, and 9;
Appendices B–G. Pull cited requirements and conventions as the verification workflows demand.

Constraints: modify nothing in the artifacts; install only what `README.md` specifies;
a failed verification workflow stops the line; the verification workflow evidence section of `DECISIONS.md` has been withheld —
do not request it before Phase 2.

For this prompt, "cold checkout" means: you start with only the four artifacts
(RULESET_MODEL.md, DECISIONS.md with item (6) redacted, README.md, AGENTS.md), this
build specification, and a clean working directory. You install only what README.md
specifies. You do not consult the builder, prior build artifacts, or any cached state.

Phase 1 — blind re-execution, in order:
1. Set up from a cold start, following only `README.md` and `AGENTS.md`; log every gap or
   ambiguity — each gap is a finding.
2. Execute verification workflows G0 step 2 through G4; record one evidence entry per workflow in the
    Section 8 format, with your own environment pins. Execute the simulated combat session
    as defined in §6.6 (S4 — Simulated combat session); record the transcript in the
    Section 8 evidence format with your own
   environment pins.
3. Audit every waiver in `DECISIONS.md` against REQ-013.
4. Re-run T29; sample five rows of the traceability table and walk each end to end.
5. Run the automated handoff verification workflow (H1–H14) and record the results.
6. Confirm the four-artifact diet: no stray files.
7. (Adversarial) Select five blocking Pattern Buffer sub-workflows (§6.6) at random
    from a weighted pool and re-execute them with your own tool calls — do not
    replay the builder's recorded calls. Sub-workflows with prior failures in the
    builder's evidence (from DECISIONS.md §6) are weighted 3×; sub-workflows
    involving state mutation (S2–S5, S9, S13, S15, S17, S22, S25) are weighted
    2×; all other blocking sub-workflows are weighted 1×. Use a different random
    seed for each re-execution. Assert every assertion in each sub-workflow's pass
    criterion holds. The selected set SHALL span ≥3 distinct REQ categories (§5.5–§5.7).
    Record any discrepancy as `DISPUTED` with both your result and the builder's
    recorded result. Report the selection, the pool weights, and the category mapping.
    Document the random selection mechanism and seed used. If the operator re-runs
    a DISPUTED adversarial item, the operator SHALL use the documented seed to
    reproduce the same sub-workflow selection. If the documented mechanism cannot
    select five blocking sub-workflows spanning ≥3 REQ categories (e.g., fewer than
    three categories have blocking sub-workflows), the verifier SHALL select all
    available blocking sub-workflows and record the shortfall as a finding.

Phase 2 — comparison, only after the operator supplies the unredacted `DECISIONS.md` and the
hash matches the commitment (REQ-275):
8. Compare your evidence entries against the recorded ones field by field, on salient
    values only — commands, pins, exit statuses, diff summaries, determinate counts;
    never wording or timestamps. Salient values are defined per workflow by the table
    below:

| Workflow | Fields to compare         | Comparison rule                                |
| -------- | ------------------------- | ---------------------------------------------- |
| G0a      | checklist pass/fail       | Exact match on pass/fail per checklist item     |
| G0b      | Appendix D pass/fail      | Exact match on pass/fail per checklist item     |
| G2       | die values, status prefixes, isError, gating decisions, coverage count | Seed-pinned dice match exactly; status prefixes match; contract coverage count matches within zero tolerance |
| G3       | tool registry diff        | Identical diff (zero added or removed tools)    |
| G4       | per-test pass/fail        | Exact match for each test ID; waived tests cite matching REQ-013 grounds |
| G5       | per-sub-workflow verdicts | Per REQ-273 tolerance: blocking/non-blocking classification matches; seed-pinned dice match; structural match for prose |
| G6       | per-module counts, tag presence | per-module active/inactive counts match within zero tolerance; all items carry source tags |

9. Classify every mismatch:
    - Discrepancy: a field in the builder's evidence record contradicts the verifier's
      independently produced evidence for the same input conditions — identical
      pinned seeds, identical fixture, identical workflow parameters produce different
      outputs.
    - Pin drift: a field differs because the execution environment changed between
      builder and verifier — runtime version, OS kernel, protocol version, or any
      other environment pin differed at execution time. Differences in outputs
      attributable to different pinned seeds (step 7 adversarial re-execution) are
      pin drift — the verifier used a different seed by design.
    - Unclassifiable: record the mismatch and both parties' values; flag for operator
      adjudication. The operator's classification is binding.
  10. Compute the overall confidence score per REQ-274 across all compared workflows —
      Discrepancies count as 0, Pin drifts as 0.2× (operator-confirmed), structural and
      exact matches as 1.0. A score below 0.80 is FAIL; 0.80–0.95 is PARTIAL with
      enumerated reservations; above 0.95 is PASS. Record the score and per-workflow
      component weights in the verifier's evidence.

Report in the format below.
```

**Report format:**

```
# Independent Verification Report
- Per-workflow verdict: PASS | FAIL | DISPUTED, with basis
- Documentation gaps found during cold-start setup
- Waiver audit: REQ-013 fields present or missing, per waiver
- Handoff verification workflow: H1–H14 results and comparison with the builder's verification record
- Evidence comparison: per-workflow salient fields — match, discrepancy, or pin drift
- Traceability: T29 result; five sampled rows walked end to end
- Adversarial Pattern Buffer re-execution: sub-workflows selected → verdicts
- Final verdict: VERIFIED | VERIFIED WITH FINDINGS | NOT VERIFIED
```

A `DISPUTED` item is resolved by the operator re-running that single contested step. The
operator's re-run result is binding — it replaces the disputed item's pass/fail status
in the evidence record regardless of which party's result it matches. If the operator's
re-run cannot be completed under the same conditions (e.g., a non-deterministic Pattern Buffer
sub-workflow with no pinned seed), the verifier's result controls and the item is
reported as VERIFIED WITH FINDINGS with the operator's attempted re-run noted. The
report is review evidence, not a build artifact.

