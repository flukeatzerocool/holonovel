# Plan — §5.16–§5.18 citation repair (F-P6b-21)

Status: draft · Kind: planned · Depth: standard
Increment: `docs/plans/2026-11-10-5-16-5-18-citation-repair/`

## 0. Revision note

Cold pass 2 (diff re-review of pass 1's fixes) resolved the blocker and five
majors and raised two majors on the changed text; both are fixed here:

- **`hasEditorialDisposition` is unexported** (`scripts/spec-delta.ts:131`) —
  the plan now moves it into `scripts/lib/spec-delta-classify.ts` and imports
  it from both callers; `scripts/spec-delta.ts` joins §4.2 and §10.
- **The T456 carrier reframed REQ-391b instead of exercising it** — T456 is
  the default listing, which the requirement explicitly excludes from its
  "on demand" clause. The clause is now recorded as F-P6b-28 (unimplemented
  surface) and REQ-391b cites only T457.

Also applied from pass 2: the T467 anchor (`:144`), the Case 2 `deploy=false`
wording, the §8 manual bar-3 row, `scripts/spec-delta.ts` in the blast radius,
the coupled register/roadmap pairing for both new findings, and the
happy-path **passage** wording in §9.

## 0a. Revision note — cold pass 1

Cold pass 1 (independent-review, 4 of 5 stages, 37 reads) raised one blocker
and five majors; all are fixed here:

- **T467 had no carrier** — the token now joins the two pipeline checks that
  assert the two-repo contract, and its row is rewritten to what they assert.
- **T492's row edit was unspecified** — the four classification cases and the
  `REQ-394, REQ-419` column are now written out, with the block half named as
  T462/T84e.
- **The output-contracts case was misdescribed** — §2 now records what it
  actually asserts, and the T459 token stays (its `tools_list_bytes` clause is
  asserted there); the unasserted description-budget clause becomes F-P6b-27.
- **The `classifyDelta` fix over-blocks 44 REQ families** — kept, with the
  fail-closed rationale recorded in §3 and in the register entry; the
  verification row is replaced with one that can actually observe the change.
- **Done-bar 3 contradicted the `G2` token** — scoped to T-tokens.

Also applied: the 20-REQ scope statement, a bucket-A/B baseline for done bar
5, corrected anchors (T720 `:202`, T491 `:282`/`:307`), qualified paths,
"append under the existing CHANGELOG heading", the named T460 exclusion, and a
read-only files row in the blast radius.

## 1. Objective

Close F-P6b-21, the top scheduled roadmap item (`ROADMAP.md:15-29`): every
`_Check:_` citation belonging to the 20 REQs that finding names must resolve
to a harness that actually exercises the cited contract. (Other REQs in §5.16–
§5.18 stay untouched.) The 2026-11-10 remediation sessions (`f5130ad`,
`d5d1823`, `0dd07a8`) already built the behaviour and most of the harnesses,
so this is a verification-and-repair increment, not an implementation one.

**Done bar**

1. F-P6b-21 is `Resolved` in `spec/audit/review-register.md` with a `file:line`
   predicate per repaired citation that resolves on the committed tree.
2. The roadmap section `§5.16–§5.18 citation repair (P1)` is retired.
3. Every `_Check:_` **T-token** in REQ-379c, REQ-381c, REQ-383b, REQ-384c,
   REQ-385b, REQ-386b, REQ-387b, REQ-389b, REQ-389c, REQ-391b, REQ-391c,
   REQ-393, REQ-395a, REQ-395b, REQ-398, REQ-419, REQ-439, REQ-557, REQ-563,
   and REQ-564 names a harness title that exists in `holonovel/scripts` or
   `scripts`; gate tokens (`G0`, `G2`) are out of scope.
4. Each cited Appendix F row agrees — description, REQ column, citing token —
   with the harness that carries its ID.
5. `npm run validate -- --write-register` does not increase the bucket-A or
   bucket-B row count recorded from `spec/audit/req-coverage.md` before the
   change; `check-registers`, `check-loop-artifacts`, `check:fast` pass.
6. Touched harnesses pass, un-piped: `test:ruleset-surface-remediation`,
   `test:output-contracts`, `test:fingerprints`, `test:selection`,
   `test:update-workflow`, `test:ironsworn`, `test:spec-tooling`,
   `test:pipeline`.
7. `npm run build-order` completes and advances the CalVer/AGENTS/DECISIONS/
   index/lockfile/server.json set.

## 2. Verified baseline

Re-verified this session unless marked.

- `npm run status`: 43 unpushed commits (oldest 42.2h), version `2026.11.10`,
  16 open roadmap items. `check:fast` **PASS** (40/40), un-piped.
- Line anchors are HEAD-relative and **advisory**; §4.0 re-derives them.
- Roadmap item text (`ROADMAP.md:15-29`) is **partly stale**: the §5.16/§5.17
  remediation session that closed F-P6b-9/-10/-11/-16/-20 also wrote the
  harnesses for eight of the thirteen §5.16/§5.17 REQs.
- Harness titles that exist at HEAD:
  - `test-ruleset-surface-remediation.ts`: T440 `:173`, T442 `:225`,
    T444 `:252`, T446 `:292`, T445 `:332`, T447 `:352`, T448 `:373`,
    T458 `:196`; plus one **untitled** case, `REQ-389b — a content-hash
    rejection reaches spec_health` `:397`.
  - `test-output-contracts.ts`: T452 `:1689`, T453 `:1590`/`:1605`; the case at
    `:1791` is titled `T460/REQ-393 + T459/REQ-392 + T456/REQ-391` and asserts
    the REQ-391a scoped listing (`:1794-1808`), `typeof h.rulesets_hydrated`
    and `typeof h.tools_list_bytes` — nothing about package-format advance or
    user data.
  - `test-fingerprints.ts`: T498 `:182`, T503 `:199`, T499 `:258`,
    T463 `:275`, T650 `:298`, T657 `:326`; `seedInstallDir` `:139`,
    `seedStateFixtures` `:148`.
  - `test-selection.ts`: T720 `:202` (`discover (detail: schema)`).
  - `test-ironsworn.ts`: T525 `:100`/`:107`.
  - `test-ruleset-gates.ts`: T656 `:328`.
  - `test-update-workflow.ts`: T462 `:292`/`:305`/`:336`/`:359`, run against a
    separate `--server-dir` fixture (`:60-75`).
  - `scripts/test-push-pipeline.ts`: T491 `:282`/`:307`; Case 2 (`:143-152`)
    asserts a full run exits 0 and the deploy clone lands on the published
    head, Case 7 (`:296-310`) a diverged clone fails closed.
- Cited IDs with **no harness title**: T431 (for REQ-387b — T431 is the
  Pattern Buffer row, `spec/appendices-reference.md:1886`), T457, T464, T467,
  T492.
- REQ `_Check:_` lines: REQ-387b → T431 (`02-requirements.md:3924`),
  REQ-391b → T457 (`:3952`), REQ-393 → T460 (`:3964`), REQ-395b → T464
  (`:3987`), REQ-398 → T467 (`:3998`), REQ-419 → T492 (`:3972`).
- Outside F-P6b-21's REQ list but adjacent: REQ-392 cites T459
  (`02-requirements.md:3958`), whose description-budget clause no harness
  asserts; the `tools_list_bytes` clause is asserted by the `:1791` case.
  Recorded as a new finding in §4.3, not fixed here.
- `manage_context (action: discover, detail: schema)` is the on-demand schema
  mechanism (`holonovel/src/index.ts:10075-10085`), asserted by T720.
- `classifyDelta` (`scripts/lib/spec-delta-classify.ts:35-49`) returns
  `editorial` only for a body-only delta carrying an Editorial disposition;
  `hasEditorialDisposition` (`scripts/spec-delta.ts:131-137`) requires the
  disposition to name the repaired REQ set. `changedReqBodies` detection is
  already exercised (`scripts/test-spec-tooling.ts:144-146`).
- `[package-incompatible]` is emitted by `holonovel/src/rulesets.ts:405` and
  asserted by T498.
- Appendix V runbooks exist: V.1 Build (`appendices-runbooks.md:13`),
  V.2 Convert (`:51`), V.3 Synthesize (`:70`), V.4 Update (`:85`);
  §0 references Appendix V (`01-foundations.md:87`). No check asserts this.
- `scripts/lib/register-checks.ts` fails a Scheduled-roadmap finding whose REQ
  leaves `ROADMAP.md`, so each finding flip and its bullet removal are one
  step.

## 3. Decisions

- **Verify before editing.** The roadmap bullets name 20 REQs, but eight
  already resolve. §4.0 produces the disposition table first; work items 4.1
  and 4.2 touch only the residuals. Rewriting already-correct citations would
  be churn and would risk breaking a passing gate for no coverage gain.
- **Re-point beats re-word.** Where an existing harness asserts the contract
  under another ID (T448 for REQ-387b, T720/T456 for REQ-391b, T498 for
  REQ-393), the citation is re-pointed and the Appendix F row is rewritten to
  the asserted contract. Only contracts with no assertion anywhere (T464
  runbooks, T492 editorial scope) get a written assertion.
- **T460 moves rather than duplicates.** T460's catalogue row names a real
  contract (package-format advance, indexed data retained, user data
  byte-for-byte) that no harness asserts; the ID moves to
  `test-fingerprints.ts` where the package-format fixtures live, and the
  output-contracts case is re-titled to the REQ-391/REQ-392 contract it does
  assert.
- **No second ID in a title unless the body serves both.** T457's token joins
  T720's title because `discover (detail: schema)` is exactly the on-demand
  surface T457 describes. Precedent: `T452/T453/REQ-389` in one title.
- **The runbook assertion lives in `test-spec-tooling.ts`.** It reads spec
  files, is wired into both gate modes, and is the existing home for
  structural spec checks. No new script and no new gate (script-discipline
  rule: extend rather than duplicate).
- **Publication stays out of scope.** The 43 unpushed commits are a separate
  `./scripts/push-pipeline.sh` action; this plan ends at a committed tree.
- **A red assertion is a defect, not a licence to narrow the test.** T492's
  third case exposes a real hole in `classifyDelta` (§4.2.3). The fix is
  cheaper than reviewing a narrowed test, and the alternative would ship a
  citation that cannot pass.
- **The `classifyDelta` fix over-blocks on purpose.** The classifier cannot
  tell a typo fix from a contract change inside a state-model or tool-surface
  REQ, so the family predicate is the mechanical proxy for "REQ scope actually
  changed" (REQ-419). A disposition can no longer lower such a body change to
  Editorial; the maintainer writes a Normal patch instead, or accepts Major.
  This is the same fail-closed direction REQ-394 already takes when the
  baseline is missing. The interpretation is recorded in the F-P6b-21 Resolved
  entry so the next reader sees the tradeoff, not just the code.
- **A cited ID needs a carrier, not a rewrite.** T467 keeps its ID: the token
  joins the pipeline Case 2 check that already asserts a completed publication
  lands the deployed clone on published `origin/main`, and its row is rewritten
  to that contract plus the block half T462 asserts. Deleting the row would
  drop a catalogue ID that later sessions may cite.

## 4. Work items

### 4.0 Preflight — disposition table (S, blocking, read-only)

- **Files:** none.
- **Design:** for each of the 20 REQs, read its `_Check:_` line, grep the
  cited token's harness title, and read the harness body. Record one row:
  `REQ | cited | harness title file:line | asserts the contract? | action
  (keep / re-point / write)`. Re-derive every §2 anchor. Where the roadmap
  bullet's claim and the tree disagree, the tree wins and the finding text is
  corrected in §4.3.
- **Tests:** none.

### 4.1 §5.16/§5.17 residual citations (M)

- **Files:** `spec/02-requirements.md` (REQ-387b, REQ-391b, REQ-393),
  `spec/appendices-reference.md` (T448, T457, T460, T498),
  `holonovel/scripts/test-output-contracts.ts`,
  `holonovel/scripts/test-fingerprints.ts`,
  `holonovel/scripts/test-selection.ts`.
- **Design:**
  1. **REQ-387b → T448.** `_Check:_ T431` becomes `_Check:_ T448.` T448's row
     REQ column (`appendices-reference.md:1903`) becomes
     `REQ-387, REQ-387b` (REQ-387a carries no `_Check:_` line, so the family
     row keeps `REQ-387`). T431's row is untouched: it is REQ-376's Pattern
     Buffer test and never asserted codex rulesets.
  2. **REQ-391b → T457.** Add the `T457` token to T720's harness title
     (`test-selection.ts:202`), which already asserts the on-demand schema and
     the unchanged summary default. Rewrite T457's row to **only** the
     contract that harness asserts — `manage_context (action: discover,
     detail: schema)` returns a matched tool's full input schema, the summary
     response is the default, and an unknown detail or a schema query without
     a query refuses `[INVALID_INPUT]` — with REQ column `REQ-391b`. REQ-391b
     `_Check:_ T457.` The "abbreviated listing" clause is conditional (MAY)
     and is recorded as conditional in the row, not asserted.
     **The tool-set clause is not re-pointed.** REQ-391b's other half — "a
     single ruleset's tool set on demand, distinct from the default listing" —
     has no distinct surface: `tools/list` is the only listing and it *is* the
     scoped default T456 asserts. Re-pointing it to T456 would let a row
     describe the surface the requirement excludes from that clause. It is
     recorded as F-P6b-28 in §4.3 instead.
  3. **REQ-393 → T460, T498.** Move T460 to `test-fingerprints.ts` as a real
     assertion in a block that seeds **both** fixture sets — the install
     directory with the stale/current packages (`seedInstallDir`, `:139`) and
     the state fixtures (`seedStateFixtures`, `:148`) — before a single boot,
     so package state and user data are observed together. Advance the
     package-format fingerprint, restart, then assert the compatible package
     stays loaded **with its indexed data**, the incompatible one carries
     `[package-incompatible]` and is held inactive, and roster, codex, and
     server-note files hash identically before and after. The Novel file is
     compared with its `data_format` key removed, because activation re-stamps
     it (T501's comment, `:220-222`); that single named exclusion goes in the
     row. Hash with `createHash("sha256")` over the file bytes (`createHash`
     is already imported, `:18`). Drop only the `T460` token from
     `test-output-contracts.ts:1791`, leaving `T459/REQ-392 + T456/REQ-391`.
     REQ-393 `_Check:_ T460, T498.`
- **Tests:** the new T460 case; existing T457/T456/T498 cases still pass.
- **Why not re-point REQ-393 to T498 alone:** T498 asserts the incompatible
  branch and the compatible-stays-loaded branch but not indexed-data retention
  or user-data preservation; REQ-393's acceptance criterion names both.

### 4.2 §5.18 residual citations (M)

- **Files:** `scripts/test-spec-tooling.ts`,
  `scripts/lib/spec-delta-classify.ts`, `scripts/spec-delta.ts`,
  `scripts/test-push-pipeline.ts`,
  `spec/02-requirements.md` (REQ-395b, REQ-398, REQ-419),
  `spec/appendices-reference.md` (T464, T467, T492).
- **Design:**
  1. **REQ-395b → T464.** Add a labelled block to `test-spec-tooling.ts`:
     `check("T464/REQ-395b: …")` for each of Convert, Build, Synthesize, and
     Update — the Appendix V section exists, and its body carries an entry
     point, a happy-path passage, and recovery steps (V.3 states its happy
     path as prose, not a heading, so the check looks for the passage); plus
     one check that `spec/01-foundations.md` references Appendix V. Dry-run
     before wiring: the sections exist today (`appendices-runbooks.md:13,51,
     70,85`), so the block must be green on the first run; a red result means
     the row's clause needs narrowing, not that the runbook is rewritten.
  2. **REQ-398 → T467, T462, T491.** Give T467 a carrier: prefix the pipeline
     Case 2 check `deploy clone landed on the published head`
     (`scripts/test-push-pipeline.ts:144`) and the Case 7 check
     `T491/REQ-418: a non-fast-forward pull names the server and fails`
     (`:307`) as the two halves of the two-repo contract. Rewrite T467's row to
     exactly that: a publication run lands the deployed clone exactly on the
     published head and a stubbed verification must not report a completed
     deploy (Case 2), and a diverged clone fails closed with no completion
     marker (Case 7); the pending-update block half is T462's `--server-dir`
     cases (`test-update-workflow.ts:60-75`), named in the row as the block
     carrier. REQ column `REQ-398`. REQ-398 `_Check:_ T467, T462, T491.` The
     "never by a bare file copy" clause is exercised by the deploy step's
     git-only path, not asserted separately; the row says so.
  3. **REQ-419 → T492.** Add labelled assertions to `test-spec-tooling.ts`:
     body-modified delta with no disposition → `minor`; with a disposition
     naming the repaired REQ → `editorial`; a disposition that omits the
     repaired REQ set → not `editorial`; a disposition on a state-model or
     tool-surface REQ → `major`, which is the classification error REQ-394
     blocks. Reuse `classifyDelta`; for the disposition cases, **move**
     `hasEditorialDisposition` out of `scripts/spec-delta.ts:131` into
     `scripts/lib/spec-delta-classify.ts` and import it from both callers —
     it is pure (string in, boolean out), already lives beside `classifyDelta`
     in spirit, and is currently unexported, so the test cannot reach it. No
     new parser, no duplicated regexes.
     **Expected red on the fourth case:** `classifyDelta`
     (`scripts/lib/spec-delta-classify.ts:46`) returns `editorial` for any
     body-only delta carrying a disposition, *before* it consults
     `hasMajorTrigger` (confirmed at HEAD). Applying the fix together with the
     assertion means the case passes on first run; the red is then demonstrated
     by diffing the pre-change classifier against the post-change one (§12).
     Fix: move the `editorial` return
     behind `!hasMajorTrigger`, so line 46 reads `if (hasModified && !hasNew
     && !hasRemoved && !hasNewSections && !hasMajorTrigger && shape.editorial)
     return "editorial";`. The existing `classifyDelta(shape(["999"], true))`
     check (`test-spec-tooling.ts:97`) still returns `editorial` because
     REQ-999 is in neither family.
     Rewrite T492's row (`appendices-reference.md:1508`) to the four
     classification cases, REQ column `REQ-394, REQ-419`, and state that the
     publication-block half is carried by T462 and T84e (pending-update gate).
     REQ-419 `_Check:_ T492, G2.`
- **Tests:** `test:spec-tooling`, `test:update-workflow`, `test:pipeline`.
- **Why not write a separate pipeline case for T467:** the two-repo behaviour
  is already split across T462 and T491; a third case over the same steps adds
  runtime without new coverage.
- **Why the `classifyDelta` fix is in scope:** done-bar item 3 cannot pass
  while T492's third case is red; the alternative — narrowing T492 to the
  behaviour HEAD happens to have — would leave REQ-419's scope-change clause
  unasserted and re-open the finding with a fresh citation.

### 4.3 Close-out — register, roadmap, changelog (S)

- **Files:** `spec/audit/review-register.md`, `ROADMAP.md`,
  `spec/audit/req-coverage.md`, `CHANGELOG.md`.
- **Design:**
  1. Flip F-P6b-21 to `Resolved` with the §4.0 disposition table summarized as
     per-citation predicates (re-pointed IDs and written assertions), record
     the fail-closed `classifyDelta` interpretation in the same entry, and
     remove the roadmap section in the same edit.
  2. Record two adjacent gaps as new findings, each with its `file:line`
     predicate and each scheduled on one new roadmap section:
     - **F-P6b-27 — REQ-392 cites T459 whose description-budget clause no
       harness asserts** (`02-requirements.md:3958`,
       `appendices-reference.md:1914`).
     - **F-P6b-28 — REQ-391b's "single ruleset's tool set on demand, distinct
       from the default listing" has no surface**; `tools/list` is the only
       listing (`holonovel/src/index.ts:15360-15385`), so the clause is
       unimplemented rather than mis-cited (`02-requirements.md:3952`).
     Open one roadmap section `§5.16–§5.17 capability citation gaps (P1)`
     holding two bullets — one per finding, each naming its REQ — with a
     `**Trigger:**` line. `scripts/lib/register-checks.ts:64-67` fails a
     `Scheduled-roadmap` finding whose REQ has no `ROADMAP.md` entry, so the
     register entry and its bullet are one edit.
  3. Regenerate the coverage register; append one bullet group under the
     existing `2026-11-10` CHANGELOG heading (`CHANGELOG.md:3`).
- **Note:** the roadmap bullet order groups REQ-439 under §5.16/§5.17 even
  though its body is an Ironsworn mechanic; it is kept in scope because the
  bullet names it.

## 5. Scaffolding and ritual

1. `plan.md`, `tasks.md`, and `aar.md` exist before the commit; `aar.md` opens
   `LOOP OPEN` and ends with its terminal token.
2. `npm run assemble` after each `spec/` edit; `npm run build-order` before the
   commit (propagates `holonovel/holonovel.md`, refreshes fingerprints,
   advances the version set).
3. `npm run validate -- --write-register` after the citation edits.
4. Touched harness headers gain the IDs they now carry (T457 in
   `test-selection.ts`; T460 in `test-fingerprints.ts`).
5. Appendix F edits are row prose only; Appendix F is outside the fingerprinted
   section set (precedent: `docs/plans/2026-11-09-p7b-remediation/plan.md:52`).

## 6. Delivery slices

One commit. The slices below are **stop points within that commit**, not
separate commits: if the session stops early it commits the tree at a slice
boundary, and the increment resumes in the next session.

| Slice | Content | State left behind |
|---|---|---|
| A | §4.0 disposition table (no edits) | Tree untouched; table recorded in `tasks.md`. |
| B | §4.1 (REQ-387b, REQ-391b, REQ-393, T460 move) | F-P6b-21 stays `Scheduled-roadmap`; roadmap unchanged. `LOOP OPEN`. |
| C | §4.2 (REQ-395b, REQ-398, REQ-419) | All citations resolve; F-P6b-21 still scheduled until §4.3. |
| D | §4.3 (register flip + roadmap retirement + F-P6b-27 + coverage + changelog) | Full done bar. `LOOP PAUSED`. |

A finding's register flip and its roadmap bullet removal are one edit in
slice D, so `check-registers` never sees a dangling finding.

## 7. Commit plan

| # | Scope | Must pass |
|---|---|---|
| 1 | Slices A–D, one spec increment | `test:ruleset-surface-remediation`, `test:output-contracts`, `test:fingerprints`, `test:selection`, `test:update-workflow`, `test:ironsworn`, `test:spec-tooling`, `test:pipeline`, `check:fast`, `build-order` |

## 8. Verification

| Step | Command | Pass |
|---|---|---|
| Touched harnesses | `npm --prefix holonovel run test:ruleset-surface-remediation` and the five siblings | exit 0 |
| Root harnesses | `npm run test:spec-tooling`, `npm run test:pipeline` | exit 0 |
| Registers | `npm run check-registers`, `npm run check-loop-artifacts` | exit 0 |
| Classification sanity | `npm run spec-delta -- --report-only` on the working tree after the fix, plus the four T492 unit cases | `test-spec-tooling` green; the reported class for this increment is `minor`, the class the CHANGELOG entry claims |
| Coverage | `npm run validate -- --write-register` | no new bucket-A/B rows |
| Full | `npm run assemble && npm run check:fast` (un-piped) | `check:fast: PASS` |
| Sync | `npm run build-order` | exit 0 |
| Close | `npm run session:close` | commit created |

Manual checks for bar items no command observes:

| Bar | Check |
|---|---|
| 1 | F-P6b-21 under `## Resolved`; every predicate present in `rg -n` output on the post-change tree. |
| 2 | `rg "§5.16–§5.18 citation repair" ROADMAP.md` returns nothing. |
| 3 | For all 20 REQs, each `_Check:_` **T-token** greps to a harness title in `holonovel/scripts` or `scripts`; `G0`/`G2` are excluded. |
| 4 | Read each cited row's description and REQ column against the harness title and the citing token; all three name one contract. |

## 9. Failure handling

- A harness red after two fixes → stop that slice, keep the finding
  `Scheduled-roadmap` and the bullet, record the predicate. Remaining slices
  still commit; the AAR is `LOOP OPEN`.
- A T464 check red on today's Appendix V → narrow the row's clause to what the
  runbook states (entry point and recovery are present; a missing happy-path
  passage is a row-text defect, not a spec rewrite).
- T460's byte-for-byte comparison is order-dependent if a fixture writes on
  boot → hash after the first boot, before the fingerprint advance, and after
  the restart; a file the server legitimately re-stamps is excluded by name
  and the exclusion is recorded in the row.
- Rollback cost 1 (`git revert`); no destructive or remote step.

## 10. Blast radius

| File | Change | Size |
|---|---|---|
| `spec/02-requirements.md` | 6 `_Check:_` lines | S |
| `spec/appendices-reference.md` | T448, T457, T460, T467, T492 rows | S |
| `holonovel/scripts/test-fingerprints.ts` | T460 assertion | M |
| `holonovel/scripts/test-output-contracts.ts` | re-title, drop T460 | S |
| `holonovel/scripts/test-selection.ts` | T720 title gains T457 | S |
| `scripts/test-spec-tooling.ts` | T464 and T492 blocks | M |
| `scripts/lib/spec-delta-classify.ts` | editorial branch yields to a major trigger; gains `hasEditorialDisposition` | S |
| `scripts/spec-delta.ts` | imports the moved helper, local copy removed | S |
| `scripts/test-push-pipeline.ts` | T467 token on two existing checks | S |
| `spec/audit/review-register.md` | F-P6b-21 `Resolved`; F-P6b-27 opened | S |
| `spec/audit/req-coverage.md` | regenerated | M |
| `ROADMAP.md` | section retired; §5.17 section opened | S |
| `CHANGELOG.md` | one bullet group under the existing 2026-11-10 heading | S |
| `holonovel.md`, `holonovel/holonovel.md` | assembled + propagated | S |
| `docs/plans/2026-11-10-5-16-5-18-citation-repair/*` | artifacts | S |

Files read but not edited at execution time (verify-only): `ROADMAP.md`,
`spec/01-foundations.md`, `spec/appendices-runbooks.md`,
`holonovel/src/index.ts`, `holonovel/src/rulesets.ts`,
`scripts/publish/steps.ts`, `scripts/spec-delta.ts`,
`scripts/lib/register-checks.ts`, `holonovel/scripts/test-update-workflow.ts`,
`holonovel/scripts/test-ironsworn.ts`,
`holonovel/scripts/test-ruleset-gates.ts`.

## 11. Alternatives considered

- **Rewrite all 20 citations from the roadmap text** — rejected: eight already
  resolve; the tree, not the stale bullet, is the authority.
- **Write T457 as a new standalone assertion** — rejected: T720 already
  asserts the mechanism; a second case would duplicate the boot cost for no
  coverage.
- **Re-point REQ-393 to T498 alone** — rejected: indexed-data retention and
  user-data preservation are unasserted clauses of the acceptance criterion.
- **Add a runbook gate to `scripts/validate.ts`** — rejected: one more
  validator surface for a single-cohort check; `test-spec-tooling` already
  reads spec files and is gate-wired.
- **Split into two sessions (§5.16/§5.17, then §5.18)** — rejected for now:
  the roadmap closes as one finding, and the union is roughly one commit. If
  slice B overruns, slice C starts the next session with the tree committed.

## 12. Execution amendment (2026-11-10)

- **Finding IDs F-P6b-22 through F-P6b-26 were already taken** — Closed-P3 and
  scheduled entries at `spec/audit/review-register.md:2097,2104,2109,2114,2118` —
  so the two new findings are **F-P6b-27** (REQ-392/T459 description budget)
  and **F-P6b-28** (REQ-391b ruleset tool set). A first amend used -24/-25 and
  collided with `:2109,2114`; the cold amendment review caught it, and every
  reference in this plan, the register, ROADMAP.md, and the CHANGELOG was
  renumbered.
- **The T492 red was not observed as a failing run.** The `classifyDelta`
  ordering fix went in with the assertion, so the case passed on its first
  execution. The red is demonstrated instead by diffing the pre-change
  classifier against the post-change one:
  `git show HEAD:scripts/lib/spec-delta-classify.ts` → REQ-025 + disposition
  returns `editorial`; the current module returns `major`; REQ-999 + disposition
  returns `editorial` in both.
- **Close-out had already landed before the amendment was written** (§4.3 items
  1-2, the register flip and the roadmap retirement, plus the two scheduled
  entries). The remaining close-out at amendment time was coverage
  regeneration and the CHANGELOG bullet, both of which followed.
- Everything else executed as written.
