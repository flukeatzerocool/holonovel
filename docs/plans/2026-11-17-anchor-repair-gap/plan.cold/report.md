# Independent cold review — anchor-repair-gap plan

```
independent-review FAILED. plan.md — 2 blockers

1. [design] D6's stated rationale is false: "(written; delta +2)" cannot match the existing
   self-test regex, so two live assertions fail — plan.md:168-171 — restate D6 (update the
   regexes, or put the delta outside the parenthetical) before P3.
2. [design] An `--offset` miss falls back to `--repath`, which can silently write a
   cross-file path although the recorded file still carries the symbol — plan.md:115-116 —
   require zero carriers in the recorded file (D1's branch condition) or refuse.

Majors: 4 · Nits: 7 · reads 25/40 · stages 5/5 (single context)
```

**Reviewer:** `deepseek-v4.1-flash` (opencode-go), `review` subagent
**Plan sha256:** `0fb99aa315dcd4bc90843f34b30c19ee78c860a77d6f34c190c0d4fa6b97fba0`
**Depth:** standard · **Read budget:** 40 · **Reads used:** 25
**Cold artifact dir:** `docs/plans/2026-11-17-anchor-repair-gap/plan.cold/`
**Stage isolation:** five stages ran in one reviewer context (nesting prohibited for the
subagent); independence from the author is genuine, independence between stages is not.

## Stage 1 — zoom out

**S1.1 [Blocker · design] — D6's compatibility claim is false.**
plan.md:168-171 says the rewritten line format becomes `… -> path:to (written; delta +2)` and that
"the existing self-test regex (`\(written\)`) keeps matching". It does not.
`scripts/test-anchor-tooling.ts:85` asserts `/-> holonovel\/src\/index\.ts:3 \(written\)/` and
`:120` asserts `/-> …:\d+ \(written\)/`; both require the literal `(written)`. Following D6
literally fails V1's C1 label at P3, and the document offers no remedy.

**S1.2 [Blocker · design] — the offset-miss fallback contradicts D1/D3.**
plan.md:115-116 lets an unresolved offset target fall back to the in-root repath. D1 makes the
repath branch reachable only when the recorded file has **zero** carriers; an offset miss supplies
a different precondition. `resolveAnchorInRoot` excludes the recorded path from `anchorCarriers`
(`scripts/lib/anchor-resolver.ts:77`), so on an offset miss the tool can return a *sibling* file
and write a cross-file move that never happened. It is reachable from the documented command:
`fix-anchors` is `refresh-predicates.ts --write --repath` (`package.json:94`).

**S1.3 [Major · design] — the Done bar claims closure of a class it only half closes.**
"A stale multi-candidate anchor is refused" differs from D1's "if the recorded line carries the
symbol, the anchor is current". A block move that puts a *different* occurrence of a dense symbol
on the recorded number self-validates silently. The tool cannot detect this without a content
fingerprint, which D2 rejects; the defect is that the residual is never stated.

**S1.4 [Major · clarity] — the CLI assertion count is stated three incompatible ways.**
plan.md:207 says 20 CLI assertions (28 total); V1 enumerates C1–C15 (15 labels → 23 total);
plan.md:247 says "C2–C15" (14 labels, silently dropping C1); the baseline is 20 total (6 unit +
14 CLI). One existing CLI case must split for C1–C15 to reach 15, and no row says which.

**S1.5 [Major · structural] — the register close leaves the finding in the wrong section.**
The cited precedent at `spec/audit/review-register.md:3135` did both: an in-place paragraph **and**
a terminal `## Resolved — 2026-11-17 REQ evidence linkage closed` entry at `:3907`, with the
paragraph pointing to it. A closed finding whose section still reads `Scheduled-roadmap` has the
wrong machine-readable disposition. Additionally, `npm run check-registers` is report-only
(`scripts/check-registers.ts:54` exits 0 on findings); only `check-registers:strict` has teeth, and
the plan promises the toothless one as acceptance.

**S1.6 [Nit] — `probe.md` is written twice by two phases.** plan.md:42 says P1 records the EV2
snippet in `probe.md`; plan.md:235-236 says P1 records it in tasks.md; P4 writes `probe.md`.

**S1.7 [Nit] — section set matches `docs/plans/README.md:16-21`. No finding; recorded because a
cold reader checks it first.**

**Verified as claimed:** 39 anchors; ten sampled recorded lines carry their symbol whole-word;
the duplicated `stateHash` anchor is real (`holosuite-invariants.ts:80`, `:87`); `args.ts:11-17`
and `:29-37` cited exactly; `gate-manifest.ts:330-335` (description at `:332`); `ROADMAP.md:43-45`
is the removable bullet and leaves two; `review-register.md:3088-3099` is the subsection and
`:3135` the linkage close; `eval-predicate.ts:24`; `46 passed` reconciles with a 50-row manifest
and 4 fast=no rows.

## Stage 2 — comprehension

**Verdict: faithful-with-gaps.** The reviewer read back the increment (identity resolution, the
declared offset, the gated repath, post-write verification, the advisory hint, the register close,
one `--single` commit) and flagged three things the artifact alone could not settle: the CLI
assertion total, whether `--offset` narrows the scan or layers on it, and whether the register
entry ends in `Scheduled-roadmap` or `Resolved`.

## Stage 3 — critics

### Design

- **D-1 = S1.2.** Gate the fallback on zero carriers in the recorded file, or drop it and name
  `--repath` as a follow-up run; state the recommended invocation given `fix-anchors` carries
  `--repath`.
- **D-2 [Major] — `--offset` scope over unselected anchors is undefined.** The tool walks every
  anchor; nothing states whether an offset run narrows to `--path` (drift elsewhere unreported) or
  keeps the full scan (offset layered on). The two implementations differ in the written set and
  the exit code.
- **D-3 = S1.1.** Verified at `test-anchor-tooling.ts:85`, `:120`.
- **D-4 [Major] — "verified" overstates the offset path.** The target test is the same predicate
  that produced the original defect; with 378 candidates for `err`, the guarantee is the
  operator's declared shift, not uniqueness. D3 demands uniqueness where it can; D2 does not.
- **D-5 [Nit] — `--check --offset` cannot distinguish a right offset from a wrong one by exit
  code** (both 1); only stderr differs.
- **D-6 [Nit] — the D2a local helper duplicates `args.ts` responsibility**; AGENTS.md requires
  flag parsing to go through `scripts/lib/args.ts`, and a value-aware `rejectUnknown` serves the
  next script.
- **D-7 [Nit] — EV6's "nothing else consumes the anchor format" is overstated.** A second
  implementation of the same contract exists in `holonovel/scripts/lib/eval-predicate.ts:29-30`
  and `:80-124`; it supports D1 and narrows the discovery claim.

### Structural

- **ST-1 = S1.4.** Counts.
- **ST-2 = S1.5.** Register disposition, and the `check-registers` acceptance is vacuous.
- **ST-3 [Nit] — P2's green reading is honestly labelled a control.** No action.
- **ST-4 [Nit] — U7 is a tautology** once the resolver takes no line parameter; keep it, but do not
  count it as behavioural coverage.

### Style

- **SY-1 [Nit] — `C2` names both the `check-script-quality` duplicate-helper detector and a CLI
  assertion.**
- **SY-2 [Nit] — the scanner-regex citation is `refresh-predicates.ts:33`, not `:31`.**
- **SY-3 [Nit] — the `probe.md`/`tasks.md` split (S1.6).**

## Stage 4 — re-zoom

Not run: no edits were made to the artifact. A re-audit after revision must re-check that the
D6/fallback fixes did not break (i) the validation matrix, (ii) V1's label list against the actual
suite output, (iii) D8 probe 3's expected stderr text.

## Stage 5 — readiness

| Element | Present? | Note |
|---|---|---|
| Target file paths | yes | all seven exist; `scripts/lib/args.ts` absent from blast radius (consistent with D2a's local helper) |
| Signatures | partial | `lineCarriesSymbol` return type/export unstated; offset/selection result shape unnamed |
| Validation rules | yes | complete |
| Acceptance criteria | **no** | counts contradict; `check-registers` acceptance vacuous |
| Executable as written | **no** | S1.1 and S1.2 |

**Readiness: NO-GO.**

## Unknowns

1. Live-corpus cleanliness sampled (10 of 39), not proven; the plan's `check-anchors` baseline is
   the full proof and was not run (read-only stage).
2. EV2's per-symbol counts not reproduced; the plan makes them reproducible in P1.
3. Stage isolation degraded (single context).
4. Inherited instructions: `AGENTS.md`, `holonovel/AGENTS.md` and user-level rules were present in
   the reviewer's context; recorded, not corrected.
5. `git` cleanliness at plan time taken from the artifact.
6. The evidence sidecar's contents were deliberately not read.

## What must change before a re-audit

1. D6 — emit the delta outside the parenthetical, or update both regexes and say so.
2. D2 fallback — require zero carriers in the recorded file, or delete the fallback.
3. D1 done bar — state the coincidental-carrier residual; scope the closure claim.
4. Assertion counts — one total, reconciled with V1's label list.
5. Register — decide `Resolved` vs in-place close + pointer, and accept on `check-registers:strict`.
