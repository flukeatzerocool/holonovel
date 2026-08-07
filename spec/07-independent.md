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
7. (Adversarial) Select five blocking Gauntlet sub-workflows (§6.6) at random
   and re-execute them with your own tool calls — do not replay the builder's
   recorded calls. Use a different random seed for each re-execution. Assert
   every assertion in each sub-workflow's pass criterion holds. Record any
   discrepancy as `DISPUTED` with both your result and the builder's recorded
   result. The five selected sub-workflows must span at least three distinct
   REQ categories (hat gating, state survival, combat resolution, error
   handling, undo, or novel lifecycle). Report the selection and the category
   mapping.
   Document the random selection mechanism and seed used. If the operator re-runs
   a DISPUTED adversarial item, the operator SHALL use the documented seed to
   reproduce the same sub-workflow selection. If the documented mechanism cannot
   select five blocking sub-workflows spanning ≥3 REQ categories (e.g., fewer than
   three categories have blocking sub-workflows), the verifier SHALL select all
   available blocking sub-workflows and record the shortfall as a finding.

Phase 2 — comparison, only after the operator supplies the unredacted `DECISIONS.md`:
8. Compare your evidence entries against the recorded ones field by field, on salient
   values only — commands, pins, exit statuses, diff summaries, determinate counts;
   never wording or timestamps. Per-workflow salient values:
   - G0 step 2: per-checklist-item pass/fail status; Appendix D check count.
   - G2: die values pinned by per-call seeds (REQ-050); coverage gap enumeration
     (which REQs are flagged as unexercised); status prefix assertions.
   - G3: registry diff line count; resource listing diff line count; whether the
     diff is clean (identical except for the new section's anchor and GM-only items).
   - G4: per-test pass/fail count; automated vs. manual test counts; any waived
     test IDs and their REQ-013 grounds.
   - S4 simulated combat: dice totals, outcomes, state transitions, character sheet
     diffs (as step 10).
   - Gauntlet sub-workflows re-executed in step 7: per-sub-workflow pass/fail,
     per-assertion results.
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
 10. Compare the simulated-combat-session transcripts on salient events only —
    dice totals, outcomes, state transitions, character sheet diffs;
     ignore prose wording, timestamps, and turn-by-turn narration.
 11. Compare your handoff verification workflow results (from Phase 1 step 5) against
     the builder's recorded H1–H14 results field by field; classify any mismatch as a
     discrepancy or pin drift per step 9.

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
- Adversarial Gauntlet re-execution: sub-workflows selected → verdicts
- Final verdict: VERIFIED | VERIFIED WITH FINDINGS | NOT VERIFIED
```

A `DISPUTED` item is resolved by the operator re-running that single contested step. The
operator's re-run result is binding — it replaces the disputed item's pass/fail status
in the evidence record regardless of which party's result it matches. If the operator's
re-run cannot be completed under the same conditions (e.g., a non-deterministic Gauntlet
sub-workflow with no pinned seed), the verifier's result controls and the item is
reported as VERIFIED WITH FINDINGS with the operator's attempted re-run noted. The
report is review evidence, not a build artifact.

