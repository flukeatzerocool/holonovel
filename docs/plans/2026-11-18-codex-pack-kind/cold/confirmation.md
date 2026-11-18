# Cold confirmation pass — codex pack as a fourth artifact kind

Reviewer: deepseek-v4.1-flash (cold review subagent, read-only)
Plan sha256: 547107c23decd78d2e9629c66656d2d11137a0c1820823481fbc8dbd295750d4
Tasks sha256: d8198c041e1d67bbb3d32386835cdcf96a9d76205d8f5171c0bedb6f3ab358b8
Prior pass: passed on f723e480… (0 blockers, 1 major NEW-1, 3 deferred nits)
Scope: three amendments only; no new-lens sweep. Reads: 5 of 6.

independent-review passed. plan.md — 0 blockers, 0 new majors

## Item status

1. REQ-621 provenance clause (NEW-1 from the prior pass) — **RESOLVED.**
   plan.md:167 now reads "the kind's content hash and any declared verifiable
   provenance before admission". The three surfaces agree in wording: D5's
   forward reference "where the kind declares verifiable provenance"
   (plan.md:143), T739's "by provenance where the kind declares a verifiable
   one" (plan.md:181-183), and V.10 step 3's "shape-checked, not attested"
   (plan.md:195). No new contradiction: the clause is vacuous for a kind with
   nothing verifiable, and the runbook states the codex case explicitly. The
   phrase is slightly stiff ("declared verifiable provenance" rather than "any
   provenance the kind can verify") but the meaning matches T739 exactly; no
   action needed.

2. REQ-621 measurement 396 → 703, longest sentence 42 words — **CONFIRMED.**
   Measured the pasted body (plan.md:165-173) with the previous pass's method:
   raw 733 bytes, 9 wrapped lines, 8 internal breaks → 692 content, 700 joined
   with single spaces, 703 under the plan's constant +3 convention
   (plan.md:149). The +11 over the previous 692 is exactly "verifiable ".
   Inside the 800-char limit (scripts/validate.ts:203-205). Longest sentence is
   REQ-621's opening clause (plan.md:165-168): 42 words counted, one over the
   previous 41 after adding "verifiable", inside the 45-word limit (the limit
   the validator applies at scripts/lib/req-checks.ts:589-596). Sentence count
   is unchanged at 4 because only a word was inserted.

3. Blast-radius runbook row — **CONFIRMED.** plan.md:279 now reads
   "V.10 exchange-format list and steps 1, 3, and 4", matching D6
   (plan.md:193-196: formats list, step 1, step 3, step 4). The deferred nit
   from the prior pass is closed.

4. New risk row — **CONFIRMED, consistent.** plan.md:382 states the
   different-order risk with D3's sort and T2's two-order assertion as the
   mitigation; T2's accept carries the same probe (tasks.md:15-17). Line 380's
   older phrasing of the hash input without the sort is now harmless because
   :382 states the canonicalisation explicitly.

5. T1 anchor wording — **CONFIRMED, stale phrase gone.** tasks.md:6-7 now reads
   "seventeen `index.ts` anchors below line 11321 and exactly two at or after
   it"; the only remaining "at or below" in either file is V4's unrelated
   "warnings at or below the 303 baseline" (plan.md:345). The count matches the
   plan (P1, plan.md:312-313) and the tree (19 anchors; 17 below 11321).
   Cosmetic Nit C1: the same 17/2 criterion now appears twice inside T1 — the
   instruction (tasks.md:6-7) and the Accept (tasks.md:9-10). The dispatcher's
   note that the duplicate accept sentence was removed does not match the file:
   the accept sentence is still present and the instruction was rewritten to
   repeat it. Harmless (the accept governs per tasks.md:3); drop one if the
   duplication is unwanted.

## Notes

- No new Blocker or Major. The amendments are internally consistent and the
  arithmetic reproduces exactly.
- Same staging limitation as the prior passes: single cold context, changed
  regions only; the body-length convention (+3) is the one calibrated against
  the current 762/396 baselines in the previous pass.
