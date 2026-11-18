Plan sha256: 13f61c3daaa66c33ccac9b25ce9d7c6ac85b5b6ef23272e0d8c7a2749793ae8a
Reviewed revision: 3 (`plan_sha256 56c54610…`); the bytes in force also carry two post-review delta
amendments at the end of `plan.md` — a correction to the predicted coverage-register cell order
(`S22` → `T253, S22`) and the `holonovel/src/generated/g7-attestation.ts` blast-radius addition,
both discovered during execution and both text-only (no file-list, gate, or destructive change).
Artifact: docs/plans/2026-11-17-roadmap-drain-11/plan.md (revision 3)

# Verification report — revision 3, condition-only amendment (M4 + N8)

Reads used: 3 of 4 (`plan.md`, `plan.cold/review-r2.md`, `holonovel/DECISIONS.md:2505-2530`). All in scope; no other text opened.

### 1. M4 — clause (a) blank-line tolerance

**Fix present.** `plan.md:134-139` now reads: the record is "the contiguous `- ` bullet run that follows the marker — **blank lines between the marker and the run are skipped, and the run ends at the first non-bullet, non-blank line** — and that run is scanned for the labels in (b)". Both halves of the r2 remedy are present (leading-blank tolerance, non-blank terminator); nothing in the plan retains the old "immediately following / first non-bullet" wording.

**Live block satisfies it** (`holonovel/DECISIONS.md`):
- `:2511` `@section evidence` (marker).
- `:2512` blank → skipped by the fixed rule.
- `:2513-2518` the six required bold labels exactly as clause (b) enumerates — `**Workflow**`, `**Timestamp**`, `**Environment pins**`, `**Commands and output**`, `**Pass/fail**`, `**Findings**`, each with a non-empty value after ` — `. Matches clause (b) at `plan.md:140-142`.
- `:2519-2521` three sub-check bullets of the exact clause-(f) shape `- **(<lowercase letter>) <name>** — <non-empty result>` (clause (f) at `plan.md:147-150` predicts `(a)`/`(b)`/`(c)` at `:2519-2521` — verified).
- `:2522` a fourth bullet with a non-required label; correctly covered by clause (a)'s "bullets carrying other labels (today four of them, `:2519-2522`) are ignored".
- `:2523` blank, `:2524` `<!-- g7:start -->` → the first non-bullet, non-blank line. Run = `:2513-2522`, exactly as intended.

No contradiction remains with `plan.md:322-323` (P1: six labels at `:2513-2518` satisfy D2 by inspection) or `:334` (`checkEvidenceRecordContract` reports nothing on the unmodified tree). The r2 blocker condition is closed; `C-1` in `review-r2.md:67-69` is satisfied.

### 2. N8 — countable diff-case set

**Fix present and countable.** `plan.md:352-358` names eight diff cases, enumerated and each traceable to a D3 predicate:
1. suppression only on `automated-unexercised` (`plan.md:169-171`); 2. other verdicts unsuppressible even with a matching key (`:170-172`); 3. stale key (`:172-173`); 4. entry `class` outside `LINKAGE_CLASSES` (`:172-173`, `:199-202`); 5. empty `evidence` (`:172-173`); 6. duplicate key (`:173`); 7. `classes` header differing from `LINKAGE_CLASSES` (`:199-202`); 8. missing baseline file (`:209-210`). The eight matches the r2 counter-example list exactly (the r2 finding named the same eight), so V4's "with the new diff and T253 cases counted" (`plan.md:381`) is now checkable. The five T253 parser cases appended after the dash are separately named.

### 3. Revision-3 "Review history" accuracy

`plan.md:26-29` states the diff re-review raised "one regression and one Nit", both fixed in revision 3, describing them as "clause (a) had dropped the blank-line tolerance and would have failed on the live record" and "'the six diff cases' was not a countable set", with "Revision 3 restores the tolerance and names the eight cases." That matches `review-r2.md:28` (M4: the N1 rewrite dropped `review-r1.md:89`'s "non-blank"), `:33` (N8), `:47` (`Majors 1 · Nits 1`), and the actual revised text at `plan.md:134-139` / `:352-358`. Header `Revision: 3` at `plan.md:3` is consistent.

### Unknown (not a finding, not counted)

1. Clause (a) does not say what happens to a blank line **inside** the bullet run — it skips blanks before the run and terminates on a non-blank non-bullet, so a mid-run blank would be read as continuation. The live record is contiguous (`:2513-2522`, no interior blank), so no current failure and no plan contradiction; relevant only if a future record is written with blank-line separators between bullets.

`independent-review passed.`
`New: Blockers 0 · Majors 0 · Nits 0`
