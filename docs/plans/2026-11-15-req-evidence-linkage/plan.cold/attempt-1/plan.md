# REQ evidence linkage — 2026-11-15

ROADMAP item *REQ evidence linkage (P1)*: a REQ whose `_Check:_` cites a T-ID must
land on an Appendix F row whose kind admits that evidence; an `Automated` row must
be named by a real harness, a `Manual` row by a documented procedure.

## 1. Questions

1. Is a cited-but-unexercised T-ID already an error somewhere, and does that
   error name the citation?
2. Where do the citations come from — the REQ body's `_Check:_` text, or
   Appendix F's REQ column?
3. What is the finding population under the real data path, and does it fit one
   session?

## 2. Evidence (class: repo — every claim in this section is a repo read)

**Where citations actually come from.** `checkImplCoverage`
(`scripts/validate.ts:2051`) builds `specTests` at `:2071-2075` from
`parseAppendixFReqTests` (Appendix F's REQ column) and the sub-workflow map. It
**never extracts the cited IDs from the `_Check:_` text** — `bodies` (`:2054`) is
used only for a `hasCheck` boolean at `:2078-2081`. A T-ID cited in a REQ body
but attributed to a different REQ in Appendix F is invisible to the bucket join.

**What already errors.** Bucket B is not merely advisory: B5
(`scripts/lib/req-checks.ts:310`, wired at `validate.ts:2701-2711`) *errors* on
any REQ that newly buckets to B relative to the committed register. But the
message names the **REQ**, not the cited T-ID, and it is baseline-ratcheted:
existing B rows are tolerated until the register is regenerated. Bucket E
(`INTENDED_GAP_REQS`, 117 REQs, `:1903`) exempts a whole REQ, so a builder-side
REQ's citation is never examined. Neither covers the kind-aware rule.

**Kind is parsed away.** `parseAppendixFTestText` (`:1672-1686`) returns
`tid → cells[3]` (description); the kind at `cells[2]` is dropped. Its sibling
`parseAppendixFReqTests` (`:1816-1834`) parses the same slice with `[^|]*` for
the kind cell (`:1823`). Both slice from the `| #     | Type     | Test` anchor
to the next `##` (`:1676`, `:1820`) and each has exactly two/one call sites
(`:1712`, `:2634`; `:2052`). `scripts/compare-spec-code.ts:169` holds a third
copy — a separate script's, out of scope.

**Exercised set.** `gatherExercisedIds` (`:1448-1461`) scans the **whole**
`test("<name>")` string, not the prefix (`:1457`), and reads the harness files
independently of `collectHarnessSources` (`:1548-1571`), which caches a scan of
the same files. Two scans of the same corpus; P2 collapses them.

**Manual kind has no procedure field.** Appendix F's preamble
(`spec/appendices-reference.md:1444`) states: "Manual tests must document the
verification procedure and expected output shape in `DECISIONS.md`." The
predicate is therefore "the T-ID is named in `holonovel/DECISIONS.md`", matched
`\b`-anchored so `T84` is not satisfied by `T84e` (`DECISIONS.md:864`).

**Vocabulary.** Appendix F holds 772 rows and 771 distinct IDs: 748 `Automated`
and 23 `Manual`. There is **no `Gate` kind**; the roadmap's "Manual or Gate row"
clause describes a kind that does not exist.

**A duplicate ID worth recording.** The one row that the `Map` overwrites is a
collision: `T553` appears twice with different definitions —
`spec/appendices-reference.md:1822` (bound-key unlock, REQ-284f) and `:1984`
(question identity, REQ-463) — and *both* are exercised, by
`holonovel/scripts/test-output-contracts.ts:2554` and `test-belief.ts:116`.
Both rows are `Automated`, so the kind rule's verdict is unaffected; renumbering
one ID touches a spec row, its citation, and a harness test name, so it is
scheduled (P7), not fixed here.

**Population under the specified data path** — `readSpec()` + `extractReqBodies`
+ the Appendix F slice + the `test("<name>")` scan. Unit: one citation pair =
(REQ id as written in the body, one distinct T-ID after its Check marker).

| Measure | Value |
|---|---|
| REQ bodies / with a Check citation | 1326 / 716 |
| Citation pairs (845 Automated, 39 Manual) | 884 |
| Of the 39 Manual pairs: named in `DECISIONS.md` / not | 16 / 23 |
| Exercised harness IDs | 685 |
| Findings: Automated unexercised / Manual undocumented / no row | 99 / 23 / 0 |
| Findings inside `INTENDED_GAP_REQS` / outside | 99 / 23 (8 Automated, 15 Manual) |

The `INTENDED_GAP` split is the load-bearing number: **99 of 122 findings are
builder-side REQs the audit already disposes of.** P5 therefore prints those as
`NOTE: intended-gap …` and only the 23 outside-gap findings count as warnings.

**Stale ROADMAP claim.** `ROADMAP.md:33-34` says T22, T35, and T103 have "no
asserting harness". All three are exercised — `test-output-contracts.ts:2730`
(T22), `:2808` (T35), `test-workflow.ts:200` (T103).

**Baseline.** `npm run check:fast` → 46 passed, 0 failed. `npm run validate` →
0 errors, 300 warnings; buckets A 0 / B 0 / C 492 / D 0 / E 117. `npm run
test:validators` → 65 passed. `npx tsx scripts/spec-update-record.ts --check` →
`ERROR: holonovel: unpublished spec delta with no '### Holonovel Spec Update —
2026-11-15' entry.`

## 3. Definitions

**Citation extraction rule (the check's population).** For each REQ body from
`getReqBodies(text)`: find the **last** occurrence of `*Check:*` or `_Check:_`
in that body (both forms are live — `validate.ts:2080`); take the text from that
marker to the end of the body; collect every token matching
`\bT\d+[a-z0-9]*\b`; de-duplicate within the REQ. `S`/`I` sub-workflow tokens
are out of scope (the rule is about T-IDs, and `specTests` merges the §6.6 map
at `:2074`). A marker with no T-ID after it yields no citation. The REQ id is
the id **as written** (`REQ-284f`), not the base collapse the coverage audit
performs at `:2067-2075`, because triage edits the specific body.

**Kind rule.** `row.kind` is `cells[2].trim()`; a value outside
`{Automated, Manual}` is itself a finding (it is how a `Gate` kind would be
caught if one were ever added). An `Automated` citation must appear in the
exercised set; a `Manual` citation must match `\b<id>\b` in `DECISIONS.md`.

## 4. Done bar

**Done bar:** `extractCheckCitations` and `checkReqEvidenceLinkage` exist as pure
functions in `scripts/lib/req-checks.ts`; `validate` prints their findings
**report-only** (up to 10 `WARNING: REQ-EVIDENCE …` lines for findings outside
`INTENDED_GAP_REQS`, up to 5 `NOTE: REQ-EVIDENCE intended-gap …` lines inside
it, then a total line) and still exits 0; `npm run test:validators`
carries four red cases (unexercised Automated, undocumented Manual, no-row,
unknown kind), one green case (exercised + Manual named), and one
`extractCheckCitations` case; the full corpus list
is captured at `docs/plans/2026-11-15-req-evidence-linkage/corpus.md`;
`spec/audit/review-register.md` carries a `Scheduled-roadmap` row naming the
ROADMAP section; `ROADMAP.md` gains a priority-P3 section for the `T553`
collision and loses the false T22/T35/T103 parenthetical; `check:fast` is green;
the increment closes as one commit through `npm run session:close --single` with
an AAR ending `LOOP PAUSED`.

Triage-to-zero and error-mode are **not** in this bar — the 23 outside-gap
findings are a separate increment.

## 5. Non-goals

- Error-mode. It is the ROADMAP close condition, reachable only after triage.
- Fixing the 122 findings: they are REQ-body edits and new harnesses.
- Renumbering the duplicated `T553` row (scheduled at `ROADMAP.md`, priority P3).
- Inventing a `Gate` kind. It does not exist; the register row records that.
- Unifying `scripts/compare-spec-code.ts:169`'s copy of the row parser.
- A new gate row or npm script — the check rides inside `validate`'s pass and
  reports through `npm run test:validators`.

The two `ROADMAP.md` edits are not scope creep: both are defects the dry run
surfaced (a false evidence claim and a duplicated identifier), and the AAR
contract requires every finding to carry a terminal disposition.

## 6. Blast radius and commit plan

Three scripts (`validate.ts`, `lib/req-checks.ts`, `test-req-checks.ts`) plus
`docs/plans/…/corpus.md`, `spec/audit/review-register.md`, `ROADMAP.md` and
`CHANGELOG.md`. Estimated 180–260 changed lines. One commit via
`npm run session:close --single`: the change is one contract (a report-only
check plus the two records its first run produced) and splitting it would land a
check whose corpus is not committed. Rollback cost 1 (revert the commit; no
persisted format, no gate severity change).

Gate order (fast-fail): `npm run test:validators` → `npm run validate` →
`npm run assemble` → `npm run check:fast`.

## 7. Phases

### P0 — Preamble: recorded confirmation (not a phase; no edits)

`checkImplCoverage:2051-2110`, B5 `:2701-2711`, `exercised` `:1448-1461`, and
the 122-finding population with its `INTENDED_GAP` split are recorded above. No
kill switch remains: the check's distinct output is pair-level, kind-aware,
T-ID-named.

### P1 — One kind-aware row parser, one parse

- **`scripts/validate.ts:1672-1686`** — `parseAppendixFTestText` becomes
  `parseAppendixFRows(text): Map<string, { kind: string; desc: string; reqs: Set<string> }>`,
  reading `cells[2].trim()`, `cells[3]`, and the REQ cell (the last cell before
  the trailing pipe — index 4 in today's six-cell rows). **Duplicate T-IDs union their
  `reqs` sets and keep the first row's `kind`/`desc`:** keying by `tid` alone
  would drop REQ-284f's `T553` association that
  `parseAppendixFReqTests` collects today (`:1827-1831` adds the ID to every REQ
  in the cell), silently flipping a bucket and failing V2.
- **`scripts/validate.ts`** — add `getAppendixFRows(text)`, cached like
  `harnessSourcesCache`, and route all four consumers through it: `:1712`
  (`.desc`), `:2052` (invert `reqs` to a REQ→T map), `:2634` (`.keys()`), P5.
- **`scripts/validate.ts:1816-1834`** — delete `parseAppendixFReqTests`.
- **Test:** `npm run validate` — 0 errors; buckets A 0 / B 0 / C 492 / D 0 /
  E 117; the output still contains
  `PASS: Every harness title ID resolves to the Appendix F catalogue`.

### P2 — Share the parses

- **`scripts/validate.ts`** — **add** two cached getters beside
  `harnessSourcesCache` (neither exists today): `getReqBodies(text)` returning
  the `extractReqBodies` shape (`Map<string, { id: string; body: string }>`,
  `scripts/lib/parse-spec.ts:36`) and `getDecisionsText()` returning `string`
  (`""` when the file is absent — both existing reads at `:1639`, `:1703` are
  try/catch-guarded). `:2054` and P5 read the first; P5 reads the second.
- **`scripts/validate.ts:1448-1461`** — `gatherExercisedIds` keeps its
  signature (`Set<string>`) and returns
  `new Set(collectHarnessTestNames().flatMap((t) => t.all))`, reusing the helper
  at `:1572` (`HarnessTest.all`, `:1564`) instead of a second file scan. The
  call site at `:2605` is unchanged.
- **Test:** `npm run validate` reports `exercised test IDs: 685` (unchanged) and
  the same bucket counts; `sed -n '1448,1461p' scripts/validate.ts | grep -c readFileSync` is 0, which
  is what fails if the refactor is skipped.

### P3 — The pure functions

- **`scripts/lib/req-checks.ts:645`** (append after `checkHarnessTitleIds`, the
  file's last export) — two exports:
  `extractCheckCitations(bodies: Map<string, { body: string }>): Map<string, string[]>`
  implementing §3's rule, and
  `checkReqEvidenceLinkage(input: { citations: Map<string, string[]>; rows: Map<string, { kind: string }>; exercised: ReadonlySet<string>; decisionsText: string }): { reqId: string; tid: string; kind: "Automated" | "Manual" | "no-row" | "unknown-kind" }[]`.
  `citations` is keyed by REQ id, valued by cited T-IDs.
- **Test:** `npm run typecheck` — compile-only; the rule's behaviour is proven in
  P4, before it is wired.

### P4 — Self-tests (before wiring)

- **`scripts/test-req-checks.ts:674`** (after the harness-title test that ends at
  `:673`, using the existing `test()` helper at `:16`) — red: unexercised Automated; red:
  Manual not named in `DECISIONS.md`; red: cited ID with no row; red: unknown
  kind; **one green test with two assertions** (exercised Automated and Manual
  named). Plus one `extractCheckCitations` case (two marker forms, trailing
  tokens after a second marker, `T84` not matched by `T84e`).
- **Test:** `npm run test:validators`.

### P5 — Wire report-only

- **`scripts/validate.ts`**, in `main()` immediately after the
  `checkImplCoverage(...)` call at `:2605` (so `text`, `warnings` and
  `exercisedIds` are already in scope): build `citations` via
  `extractCheckCitations(getReqBodies(text))`, pass `getAppendixFRows(text)`,
  `exercisedIds` and `getDecisionsText()`. Partition with
  `INTENDED_GAP_REQS.has(baseReq(reqId))` (the set holds base ids only, so the
  collapse is required for the split to match §2; `baseReq` is
  `validate.ts:1844`). Emit at most **10** lines shaped
  `WARNING: REQ-EVIDENCE <REQ> — <T-ID> — <kind>` (outside-gap findings first,
  sorted ascending by REQ id then T-ID — `REQ-002 — T18 — Manual` is
  line 1 and `REQ-012 — T4 — Automated` line 2), then at most **5** lines shaped
  `NOTE: REQ-EVIDENCE intended-gap <REQ> — <T-ID> — <kind>`, then
  `REQ evidence linkage: N finding(s) — M outside intended gaps (full list: <corpus path>)`;
  add only `M` to `warnings`. The `REQ-EVIDENCE` token is what makes the lines
  greppable apart from the 160 pre-existing `WARNING: REQ-…` ambiguity lines;
  no other counter is printed. Both caps are independent, so both
  branches are reachable; the full list lives in `corpus.md` (P6). Never
  `errors`; no `implStrict` branch.
- **Test:** `npm run validate` exits 0 and prints
  `REQ evidence linkage: 122 finding(s) — 23 outside intended gaps`; the
  `REQ-EVIDENCE` line counts and a named pair are asserted in V2.

### P6 — Capture the corpus

- **`docs/plans/2026-11-15-req-evidence-linkage/corpus.md`** — one table row
  **per finding** (`| REQ-… | T-ID | kind | disposition |`), sorted by REQ id,
  with the `INTENDED_GAP` marker in the disposition column and the `T553`
  collision noted below the table. The run's numbers are what P7
  commits, and they **must reconcile with §2's table** (716 cited REQs, 884
  pairs, 122 findings, 23 outside gaps); a difference means the extraction rule
  and the measurement disagree — stop and amend, do not adopt the new number.
- **Test:** `grep -c '^| REQ-' corpus.md` equals the summary line's `N`.

### P7 — Record

- **`spec/audit/review-register.md`** — one dated row in `## Scheduled-roadmap`:
  disposition `Scheduled-roadmap`, quoting the section title verbatim —
  **"REQ evidence linkage (P1)"** — and carrying **no `REQ-…` token**
  (`register-checks.ts:61-69` inspects REQ tokens and dates only; a title-only
  row is what the gate accepts). The row records the run's split and the note
  that Appendix F has no `Gate` kind. **Decided, not contingent:** a title-only row is what the gate accepts. If V4
  rejects it the plan's reading of the gate is wrong and the increment stops for
  an amendment; no fallback shape is improvised at the gate.
- **`ROADMAP.md:33-34`** — replace the false parenthetical with this sentence:
  "T22, T35, and T103 each have an asserting harness; the week's defect class is
  122 unlinked citations, 99 of them outside the intended-gap exemption." The `:30` "Manual or Gate row" clause stays; the register row
  records why (the kind does not exist).
- **`ROADMAP.md`** — one new section, **priority P3**, for the duplicated
  `T553` row, with its `**Trigger:**` line. ROADMAP sections carry no date
  field; the date lives in the CHANGELOG entry and the register row.
- **`CHANGELOG.md`**; then P8.
- **Test:** `npm run check-registers` and `npm run check-roadmap` (V4).

### P8 — Gates and close

`npm run assemble && npm run check:fast`; real `aar.md` (replacing the
placeholder); `npm run session:close --single`.
- **Test:** `check:fast: PASS`, then `npm run check-loop-artifacts`; the AAR ends
  `LOOP PAUSED`.

## 8. Verification

| # | Command | Expected |
|---|---|---|
| V1 | `npm run test:validators` | **71 passed** (baseline 65 + 6 cases), and the output names all six new cases: four red (`PASS` on the corrected fixture) plus `extractCheckCitations`; `grep -c 'unexercised\|undocumented\|no Appendix F row\|unknown kind\|marker'` ≥ 6 |
| V2 | `npm run validate` | exit 0; buckets A 0 / B 0 / C 492 / D 0 / E 117; `REQ evidence linkage: 122 finding(s) — 23 outside intended gaps`; `grep -c '^WARNING: REQ-EVIDENCE '` = 10; `grep -c '^NOTE: REQ-EVIDENCE intended-gap '` = 5; the output contains `REQ-EVIDENCE REQ-012 — T4 — Automated` |
| V3 | `npm run check:fast` | trailing `check:fast: PASS` |
| V4 | `npm run check-registers` + `npm run check-roadmap` | PASS with both new rows |
| V5 | `grep -c '^| REQ-' docs/plans/2026-11-15-req-evidence-linkage/corpus.md` | **122** (the §2 figure, not the run's own claim) |
| V6 | `grep -c T553 docs/plans/2026-11-15-req-evidence-linkage/corpus.md` | ≥ 1 (the collision is recorded) |
| V7 | `grep -c 'no asserting harness' ROADMAP.md` = 0 **and** `grep -c 'each have an asserting harness' ROADMAP.md` = 1 | the false parenthetical is replaced, not merely deleted |
| V7a | `grep -c 'T553' ROADMAP.md` | ≥ 1 (the collision section exists) |
| V8 | `grep -cE "^import .*node:fs" scripts/lib/req-checks.ts` = 0 and `grep -c 'fs\.' scripts/lib/req-checks.ts` = 0 | 0 and 0 (the two functions are pure under any fs spelling) |
| V9 | `npm run check-loop-artifacts` | 0 errors; the AAR ends `LOOP PAUSED` |
| V10 (informational, expected-fail) | `npx tsx scripts/spec-update-record.ts --check` | the standing `unpublished spec delta` error — owned by the publication session, not this increment |

## 9. Resolved questions

- Corpus grouping: one row per finding, sorted by REQ id (P6) — triage is a REQ
  edit, so REQ is the sort key and the T-ID is a column.
- The `T553` renumber is scheduled on `ROADMAP.md` (P7): it needs a harness
  test-name edit.
- The register row cites the section title and no REQ token (P7).

## 10. Risks

- **Noise in the 23 outside-gap findings.** `exercised` counts only
  `test("<name>")` literals; an ID asserted from a helper reads as unlinked.
  The 10/5 line caps keep gate output bounded; triage decides, not this
  increment.
- **The Manual predicate is a proxy.** A bare mention in `DECISIONS.md` passes
  without documenting a procedure. Triage adjudicates; a stricter predicate is a
  later increment.
- **Parser consolidation is the highest-risk step** (it feeds the coverage
  audit). The guard is V2's unchanged bucket counts and the coverage-register
  freshness ERROR at `:2740-2742`, not the self-test file.
- **Register cross-reference.** A `Scheduled-roadmap` row must resolve to a
  ROADMAP entry; the row quotes the section title verbatim.
- **Scope creep into triage.** Bounded by the done bar; triage has its own
  increment behind the same ROADMAP trigger.
- **Scratch checkout.** With `DECISIONS.md` absent, `getDecisionsText()` returns
  `""` and all 39 Manual pairs report as findings. Correct behaviour (no
  documented procedure), but the list is not comparable to a full checkout's.
- **Warning-total drift.** Adding `M` to `warnings` moves the aggregate line from
  300 to 323. The proofread-register comparison is unaffected: it reduces its
  own `proofreadTotal` at `validate.ts:2349` and never reads `warnings`.
