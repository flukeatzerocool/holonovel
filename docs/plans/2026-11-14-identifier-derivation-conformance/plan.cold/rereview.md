# Diff re-review — identifier-derivation conformance plan

Artifact: `docs/plans/2026-11-14-identifier-derivation-conformance/plan.md`
Declared sha256: `5365b067cf26793ba8f0e7b244dcd24aae5b2684fd98ade931201721d5479039` — recomputed, matches
Tasks: `docs/plans/2026-11-14-identifier-derivation-conformance/tasks.md` — sha256 `a3756733ac2a7cf05555a2b80b51956ddd8e13f1ac5ec2e1616206c1d6c78f87`
Protocol: diff re-review, changed lines only; no re-sweep, no stage re-run. Prior findings supplied by the parent.
Reads used: 5 / 10.

## (a) Per-finding status

| # | Status | Predicate |
|---|---|---|
| **B1** anchor bar asserted a false value | **CLOSED** | plan.md:90-95 now asserts `setactivestate` and explains why (`anchors.ts:21` deletes `_`, `:22` hyphenates only whitespace). Matches HEAD exactly. Step 7 (plan.md:208-211) states the opening boundary and the unchanged punctuation strip; step 9 (plan.md:239) tests it; `tasks.md:33-36` mirrors it. The "no mid-token `_`→`-` mapping" decision is now explicit in bar 1. |
| **B2** missing Appendix E manifest row | **CLOSED** | New step 2a (plan.md:171-175) adds `\| REQ-659 \| Slug derivation \| 2026-11-14 \|` after `REQ-658` and names the audit's dependency (`scripts/validate.ts:81-91`); bar 5 (plan.md:106-112) lists all four surfaces plus "no `undefinedReqs`"; Q3 (plan.md:33-35), blast radius (plan.md:141) and the rollback line (plan.md:8) all name it. Row/date format matches the Appendix E table's three columns (`spec/appendices-reference.md:101-102,1143-1150`, verified in the prior pass). `tasks.md:14-15` and T2's "no backticked list over five tokens" agree. |
| **B3** `fitSlugToPath` return contract undefined | **CLOSED** | plan.md:193-204: `fitSlug(slug, stateDir, ext = ".json"): string` "returns the **fitted slug**, never a path", with the path invariant `path.join(stateDir,"novels",r+ext).length <= 240`, `r === slug` when it fits, and an explicit identity contract binding it to `novel.slug`, the `novels` key, `saveNovel` (`state.ts:1484`) and the rename rewrite (`index.ts:13574-13579`). `tasks.md:27-32` matches. |
| **M1** `con-1` unadmittable | **CLOSED** | Plan.md:330-335 splits the predicates (derivation = pre-remap stem; admission = literal stem); step 8a (plan.md:223-226) says "literal reserved stem (so a slug this build produced, `con-1`, is admissible)"; step 9 (plan.md:246) and `tasks.md:43-47` carry the round-trip case. |
| **M2** T9 false-positive predicate | **CLOSED** | `tasks.md:39-42` scopes the done-predicate to the five named `file:line` pairs and declares other `index.ts` occurrences out of scope. Bar 3 (plan.md:101-103) remains correctly line-scoped. |
| **M3** REQ body trips the catalog detector | **CLOSED** | plan.md:163-170 forbids enumerating the reserved names, cites §7.1a instead, and names the detector (`scripts/validate.ts:206-211`; the plan cites `:206-214`, which contains it). Bar 5 adds the ≤800-character body limit (plan.md:106-108). `tasks.md:10-13` carries both. |
| **M4** `build-order` bar vs environment-Unknown allowance | **STILL OPEN (Major, narrowed)** | Bar 8 (plan.md:121-127) now names the three full-only gates and requires a named probe, but adds "does **not** count as a pass" while step 14 (plan.md:270-274) still says "recorded as an environment Unknown". The revision also now contradicts the gate it describes: `scripts/check-container-image.ts:12,42-47` prints "docker daemon not reachable — skipping" and `process.exit(0)` — the gate **passes** when the environment cannot run it, so `build-order` completes and there is no Unknown to record. The bar as written is either false (the gate does count as a pass) or unmeetable (an unavailable gate can never be a pass, so bar 8 can never close). See also NEW-2 below. |
| **M5** machine-dependent identity | **CLOSED** | D10 (plan.md:313-320) states the `(name, stateDir)` dependence as the spec's intended contract (§7.1a caps the full path), names the export→import refusal consequence, and defers the spec clarification; step 9 (plan.md:244-245) adds the cross-directory test. Governance nit only: the deferral is recorded as an AAR P3 rather than a ROADMAP/DECISIONS entry, and `AGENTS.md` says the next plan comes from ROADMAP or a user request, never from AAR recommendations — acceptable for a wording clarification, but the AAR P3 should point at a ROADMAP candidate if it is to be actionable. |
| **M6** `rename` is an explicit-slug site | **CLOSED** | plan.md:217-222 gives `rename` the derivation posture with the result surfaced in the OK message and `manage_novel (action: list)`; D11 (plan.md:321-326) states the rationale and reserves refusal for admission; step 10 (plan.md:247-249) and `tasks.md:55-58` test `rename(new_slug: "CON") → con-1`. |
| **M7** enumeration narrowed to `index.ts` | **CLOSED** | plan.md:229-233 enumerates over `holonovel/src` and makes the enumeration, not the count, the authority. The chosen pattern matches both `state.ts:1484` (`"novels", `${slug}.json``) and `:1581` (`novelsDir, `${setting}.json``), the two writers the narrower grep missed. Residual: see NEW-3. |
| **N1** stale counts / T236 description | **CLOSED** | plan.md:24-27 restates the unit and registration rows; plan.md:68 now says `T236` is unit-level and the boot belongs to the following `T48` test. |
| **N2** regex asymmetric with the asterisk branch | **CLOSED as to the regex** | plan.md:206-212 widens the lookahead to `(?=\W\|$)` and drops "symmetric" from the blast radius (plan.md:135). The companion **test is wrong** — see NEW-1. |
| **N3** fallback collision | **CLOSED** | Open question 3 (plan.md:339-344) states the collision, the `[STATE_CONFLICT]` outcome, and that `T787` asserts one fallback slug, not uniqueness. |

## (b) New findings introduced by the revision

**NEW-1 [design] Blocker — the new comma-case assertion asserts a value the heading cannot produce.**
`plan.md:238` and `tasks.md:35` both require `_GM only_, open the door → the-door-open-the-door`.
Predicate: with the plan's own regex (plan.md:207), `_GM only_` matches at offset 0 (opening `^`, closing `,` is `\W`); removing it leaves `, open the door`; `anchors.ts:21` drops the comma, `:22` hyphenates the spaces, `:24` trims → **`open-the-door`**. No rule in `anchors.ts:18-24` ever yields `the-door` from this heading (only `*Keeper only* The Door` → `the-door`, `test-output-contracts.ts:435`). The expectation looks copied from that case. Fix one of the two sides: heading `_GM only_, The Door` → `the-door`, or expected `open-the-door`; apply the same correction to `tasks.md:35` and, if the intent was a second stripping case rather than a second value, say so.

**NEW-2 [design] Major — bar 8's "does not count as a pass" is contradicted by the gate implementation and not propagated to step 14.**
Same predicate as M4: `scripts/check-container-image.ts:42-47` exits 0 with a skip message when docker is absent, so `npm run check` / `build-order` complete green. Bar 8 should say: `build-order`'s exit status is authoritative; a gate that reports its own skip on stdout is recorded verbatim in `aar.md` as an environment note (not an Unknown, not a failure); a gate that exits non-zero is a failure. Step 14 (plan.md:270-274) must then repeat that rule instead of "recorded as an environment Unknown", or the two clauses keep disagreeing.

**NEW-3 [clarity] Nit — the dropped archive-import premise survives in two places.**
`plan.md:43` (Q4, "…and archive import" as an admission site) and `plan.md:308-309` (D8, "The archive-import path is enumerated in step 8a and takes the same posture") still assert the unverified second admission site, although step 8a no longer does. Since the enumeration is now the authority, state the premise as conditional in both places or drop it.

**NEW-4 [clarity] Nit — the status line is stale.**
`plan.md:3` still reads "draft v2 (self pass: 3 blockers + 6 majors applied; cold pass pending)". The cold pass has run and returned three blockers; update the line when re-stamping.

No other regression found in the revised sections: the Appendix E row format matches the table's columns, the identity contract is consistent across step 6, bar 2, T7 and T10, the literal-stem admission rule is consistent across Q1, step 8a, step 9, step 10, D8 and T9a, and the `fitSlug` hash prefix guarantees the truncated result cannot collapse back to a bare reserved stem.

## (c) Terminal

independent-review: FAILED

Remaining work: NEW-1 (Blocker, one expectation), M4/NEW-2 (Major, one bar clause plus step 14), NEW-3 and NEW-4 (Nits). Twelve of thirteen prior findings are closed with predicates; the redesign is otherwise coherent.

## Resolution (parent, after the standard re-review cap)

All four were corrected in `plan.md` v3 (`sha256 2ac9ed52…`) and `tasks.md`
(`sha256 f8b04987…`): the comma case is now `_GM only_, The Door → the-door`;
bar 8 and step 14 now treat `build-order`'s exit status as authoritative and
record a self-skipping gate's notice verbatim; Q4 and D8 make the archive-import
admission site conditional on step 8a's enumeration; the status line is v3.

Each corrected expectation was then checked mechanically against a prototype of
the proposed transforms (14 assertions, all passing): the four anchor cases, the
five `deriveSlug` cases, the cross-directory difference, the 240-character
bound, determinism, and `isSafeSlug` conformance. That is arithmetic evidence,
**not** a third independent review — the standard-depth cap allows one re-review,
and it was used.
