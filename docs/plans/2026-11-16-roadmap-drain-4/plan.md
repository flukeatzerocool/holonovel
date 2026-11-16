# Plan — Roadmap drain 4: item 3 chunk 3 (script-less evidence), five dispositions

**Date:** 2026-11-16 · **Kind:** planned · **Depth:** standard · **Revision:** 4
**Increment:** `docs/plans/2026-11-16-roadmap-drain-4` · **Rollback cost:** 1
**Evidence class:** repo — every premise is a command run or a `file:line` at `7e1a924`.
Task detail is in `tasks.md`.

**Review history.** Cold pass (4/5 stages, 19 reads) `cold-review.md` sha256
`9e83ac1d721e800df6da4dfe848d28dec66c862d1c88a44982a5af29e6209676` — FAILED, 3 blockers.
Re-review `cold-review-2.md` sha256
`4ba2b8feaabbbd45568e8346c1dc36d9c79632eaebb2666970ee6c066e2c830f` — FAILED, 2 new blockers.
Revision 3 resolved both sets; the third pass, `cold-review-3.md` (user-authorized past the
standard-depth cap), returned **independent-review passed.** with 0 blockers, 2 majors
(arithmetic/deterministic-text), 3 nits, and one deferred contradiction. Revision 4 resolves
all of them and is the revision under review.

## Questions

1. Which of the five open `ROADMAP.md` sections can move this session, and which are
   trigger-gated or operator-bound?
2. For item 3, what closes the script-less citations without weakening the check?

## Why

**EV1 — baseline is green.** `npm run check:fast` → 46 passed, 0 failed. `npx tsx
scripts/validate.ts` → `0 error(s), 396 warning(s)`; buckets A 0 / B 0 / C 493 / D 0 /
E 117; `REQ evidence linkage: 91 finding(s)`, every verdict `automated-unexercised`.
Tree clean at `7e1a924`; 137 commits unpushed, oldest 7.7 d.

**EV2 — one roadmap section is actionable in code.** `ROADMAP.md:36-56` (item 3, P1)
carries an open decision — "chunk 3 decides whether a declared gate kind is admitted or
each REQ gets a T-named assertion" — and a measured residue. The other four sections carry
triggers that have not fired or that only an operator with a different model can satisfy.

**EV3 — the residue is 91 findings: 61 script-less citations over 49 REQs, plus 30
gate-side rows that already carry a verdict.** `docs/plans/2026-11-16-roadmap-drain-3/tasks.md:100-125`
dispositions the 30 as 16 `defer-drill`, 11 `defer-noassert`, and 3 `re-cite`, with chunk 3
owning every `defer-*` row, and lists the 61-citation residue.

**EV4 — the labelling convention already exists, so the residue is plausibly a label gap,
not a missing-test gap.** `grep -rhoE 'test\("T[0-9]+' holonovel/scripts/*.ts | wc -l`
→ 888. `gatherExercisedIds` (`scripts/validate.ts:1455-1475`) reads those names plus the
root-script label shapes (`:1469-1473`), so a test that asserts the row but omits the T-ID
is invisible. This is an **assumption for P1 to measure**, not a settled fact:
`grep -ln "\.bak" holonovel/scripts/*.ts` finds no `test-*.ts`, so T88 (atomic writes) may
genuinely lack its assertion.

**EV5 — the three `re-cite` rows are a citation defect *and* an unasserted row, and the
cited path is knowable.** `scripts/check-vendor-manifest.ts` and
`scripts/check-conversion-evidence.ts` do not exist; both live under `holonovel/scripts/`
and are wired gates (`scripts/lib/gate-manifest.ts:234-237`,
`npm --prefix holonovel run check:vendor`). `grep -c "T541\|T542"` over both files → 0, so
the citation fix alone moves no verdict (`scripts/lib/req-checks.ts:886-896` closes an
`Automated` row only on an emitted label). **Neither file can carry the label that would
close the row**: `gatherExercisedIds` applies `labelsFromContent` only to root `scripts/**`
(`scripts/validate.ts:1469-1473`) and, for `holonovel/scripts/**`, accepts only a
`test("<name>")` literal (`:1463-1465`), which neither file contains. Both are nevertheless
executed — `holonovel/scripts/run-test-suite.ts:80-81` runs `check:vendor` and
`check:conversion-evidence` — so T541/T542 are class **(b)**: the assertion belongs in a
harness file that can carry a `test("T541 …")` name, not in the checker.

**EV6 — the publish record is stale.** `.holonovel-state/publish-run.json` reaches
`record: pass` at head `f447cb5`, an **ancestor** of `7e1a924`, and
`holonovel/DECISIONS.md` holds no `### Holonovel Spec Update — 2026-11-16` entry (newest is
`2026-11-08`). `npx tsx scripts/spec-update-record.ts --check` therefore exits 1. That is
the gate doing its job before publication (`scripts/publish/steps.ts:418-440` writes the
entry and fills the Verification line); it is not a defect this increment must fix.

## Roadmap disposition

| # | Section | Priority | Trigger (predicate measured this session) | Disposition |
|---|---|---|---|---|
| 1 | Independent verification (§10) | P1 | "first publish after 2026-11-16" — publish is **pending**, not done (EV6) | Operator-bound: needs a *different model* from a cold checkout with `DECISIONS.md` item (6) redacted (`spec/07-independent.md:5-16`). This session is the builder. Publish, then run the verifier; no code change here. |
| 2 | Mutation-sample depth | P2 | "next Holosuite lens change" — fired 2026-11-16 (`5a26f11`, sample 8 → 12) and was consumed by that increment | Remaining work is new deterministic lenses for the two judgment lanes (`ROADMAP.md:26-34`) — a design task with no scheduled trigger left. Record-and-close. |
| 3 | REQ evidence linkage | P1 | "corpus dry-run list triaged to zero" — 91 findings today (EV1) | **This increment.** Chunk 3 below. |
| 4 | Split `index.ts` | P2 | ">50 anchors moved" — measured with the anchor predicate `[A-Za-z0-9_./-]+\.(ts\|mjs\|js\|sh\|json):[0-9]+#` over added/removed `spec/` lines → **3**. (A loose substring count of lines containing the word "anchor" is 54; that is prose, not moved citations, and is not the metric.) `holonovel/src/index.ts` is 19,156 lines | Not triggered on the anchor clause. The second clause ("a week with >100 reads of one file") has **no measurement surface** in the repo — an AAR finding, not a phase. |
| 5 | Codex pack as artifact kind | P3 | "next artifact-registry change (REQ-620/621)" — `.holonovel-state/delta-holonovel.json` modified list contains neither | Not triggered. |

Item 3 stays on `ROADMAP.md` after this increment with its remaining count, unless that
count is zero — in which case D4 promotes the check to error-mode here and the section is
retired with the count that closed it. Items 1, 2, 4, 5 are untouched.

## Decisions

**D1 — no new Appendix F kind.** The kind column is consumed by the coverage audit
(`checkImplCoverage`) and the bucket classification; a third kind needs a branch at
`scripts/lib/req-checks.ts:897-899` and ripples into the REQ-158 family, the bucket counts,
and `check:conformance`, for no assertion benefit. Root-gate labels already close
builder-side rows (`labelsFromContent`, `scripts/lib/req-checks.ts:854-870`; T543/T544
closed this way in chunk 2). Rejected: admitting a declared `Gate` kind — it would deem a
*process step* evidence and break the invariant this check exists to enforce ("a REQ is
evidenced by an assertion that names it").

**D2 — three classes, plus a citation flag.** Every finding resolves to exactly one class:

| Class | Meaning | Closes the finding? |
|---|---|---|
| (a) label gap | an assertion exists in an executing position but does not emit the T-ID | Yes — emitted label |
| (b) no assertion | nothing asserts the row's described behaviour | Only when an assertion is authored |
| (c) manual by row content | the Appendix F description is a drill/procedure | Yes — kind `Manual` + a `DECISIONS.md` procedure line |

A citation defect (a cited path that does not exist) is **not** a fourth class; it is a
boolean `cite` flag applied to a row of class (a) or (b). Chunk-2 verdicts map as:
`defer-drill` → (c) (re-confirmed against the row description), `defer-noassert` → (b),
`re-cite` → (a) **only when the corrected path is a root `scripts/**` file whose asserting
check can carry a `labelsFromContent` label**; a `holonovel/scripts/**` path is class (b),
because that scan admits `test("<name>")` literals only (EV5). The sum test is
`a + b + c = 91`; `cite` is counted separately.

Class (c) is refused for any row whose description says "assert". A citation fix alone
never discharges a row (EV5).

**D3 — inventory before edits.** P1 produces the triage table for all 91 rows before any
file changes, so the split between (a) and (b) is measured, not assumed (EV4).

**D4 — error-mode follows zero, in this increment or the next.** `validate` promotes the
check only at zero findings. If this increment reaches zero, it promotes the check in the
same commit. Otherwise chunk 4 owns the residue and the promotion, and `ROADMAP.md` states
the count.

## Scope and blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-16-roadmap-drain-4/tasks.md` | P1 triage table (91 rows) with class, quoted home line, `cite` flag | M |
| `holonovel/scripts/test-*.ts`, `holonovel/scripts/lib/*.ts` | class (a): T-ID added to the asserting test name; class (b): authored assertions (including T541/T542) | M |
| `holonovel/scripts/check-vendor-manifest.ts`, `holonovel/scripts/check-conversion-evidence.ts` | citation targets for T541/T542 only — no label edit, per EV5 | S |
| root `scripts/*.ts` | class (a) gate labels; any `cite` fix that points at root tooling | S |
| `spec/08-synthesis.md` | `cite`: REQ-451 / REQ-451a body path → `holonovel/scripts/check-vendor-manifest.ts` | S |
| `spec/appendices-reference.md` | `cite`: T541/T542 row paths; class (c) kind flips | S–M |
| `holonovel/DECISIONS.md` | class (c) procedure lines | S |
| `spec/audit/req-coverage.md` | regenerated (class (c) flips and bucket moves) | S |
| `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` | regenerated | S |
| `ROADMAP.md`, then `spec/audit/review-register.md` | item 3 count / chunk-4 split, then the chunk-3 subsection | S |
| `CHANGELOG.md`, `aar.md` | close | S |
| `AGENTS.md` | harness command count (`:355`, `:371`) — only if P3b registers a command | S |

No `scripts/lib/req-checks.ts` change is planned; if a row needs a new admitted shape, that
is a decision amendment, not a silent edit.

**Register coupling.** `check-registers` requires every `REQ-\d{3}` named in a
`## Scheduled-roadmap` finding to appear in `ROADMAP.md` (`scripts/lib/register-checks.ts:64-69`).
Item 3 is not being retired, so the constraint is ordering: P4a updates `ROADMAP.md` before
P4b writes a register subsection that names residue REQs. `check-traceability` is not
involved (its scope is DECISIONS.md Deferred/Waived entries).

**Fingerprint membership.** Appendix F, `spec/08-synthesis.md` §11, and the cited REQ
bodies are not among the fingerprinted sections (`§5.9`, `§5.16–§5.17`, `§6.3`, `§6.4.2`,
`§7.7`, `§5.19`, Appendix Q), so these edits need `assemble` but not `build-order`. A class
(b) fix landing in a fingerprinted section becomes a task amendment.

**User impact.** No behavioural change: harness test names gain T-IDs, documents and
registers change. No server rebuild, no restart, no published-artifact change — the packed
server is byte-identical because `holonovel/src` is untouched.

## Phases

### P1 — Triage inventory (no edits)

Build the 91-row table in `tasks.md` from the generated corpus: for each `(REQ, T-ID)`,
read the Appendix F row description, locate the executing position that asserts it, and
record class, `cite`, and a **quoted home line** (`file:line: <the line>`). A row whose
home cannot be quoted is class (b), not (a). Chunk-2 verdicts are carried as the starting
class per D2 and re-confirmed against the row description. **Test:** 91 rows present;
`a + b + c = 91`; every class (a) row quotes an existing line.

### P2 — Class (a) labels

Group by file so one edit pass covers every T-ID in that harness. A class (a) row closes by
the T-ID appearing in an executing position the predicate reads: for `holonovel/scripts/**`
that is a `test("<name>")` literal only (`scripts/validate.ts:1463-1465`); for root
`scripts/**` it is a `test(...)` name, a `check(...)` argument, or a
`.push`/`console`/`return` literal inside a `function check*(…)` body
(`labelsFromContent`, `scripts/lib/req-checks.ts:854-870`). Do not rename tests for style;
the edit is the ID. **Test:** `validate` finding count falls by exactly the number of class
(a) rows applied.

### P3 — Citation fixes, class (b) assertions, class (c) reclassifications

- P3a `cite`: `spec/08-synthesis.md:412` and the REQ-451a body
  (`scripts/check-vendor-manifest.ts` → `holonovel/scripts/check-vendor-manifest.ts`), and
  the T541/T542 rows in `spec/appendices-reference.md:1974-1975` (same correction for
  `check-conversion-evidence.ts`). `npm run assemble` after.
- P3b (b): author the smallest assertion that makes the Appendix F description true; it
  must fail before the fix lands (a red read, recorded in `tasks.md`). T541/T542 land here:
  a harness file that can carry `test("T541 …")` / `test("T542 …")` spawns the checker
  (`npm --prefix holonovel run check:vendor`, `check:conversion-evidence`) and asserts exit
  0 plus the strict-failure case on an altered fixture. A harness that spawns must import
  `./lib/harness-guard.js` and signal completion (`scripts/validate.ts:1481-1489`,
  REQ-141m), or the harness fail-loud gate rejects it. If the strict case cannot be
  produced from a copy of the manifest, the row stays class (b) and is counted, not
  reclassified. A newly registered harness command also moves the documented command count
  (`AGENTS.md:355`, `:371`) in the same commit.
- P3c (c): flip the kind in `spec/appendices-reference.md` and add the
  `T<id> — <procedure>` line to `holonovel/DECISIONS.md`; `npm run assemble` after.

### P4 — Records and roadmap

- P4a `ROADMAP.md` item 3: replace the second bullet with the post-increment count and,
  when N > 0, every residue `(REQ, T-ID)` — 1–3 bullets stay. When N = 0, replace the
  whole section with the retirement note its trigger describes and state that the check is
  error-mode (D4); a retired section does not stay in `ROADMAP.md`.
- P4b `spec/audit/review-register.md`: dated chunk-3 subsection naming the classes and counts.
  It names **no** residue `REQ-\d{3}`: `check-registers` requires every REQ in a
  Scheduled-roadmap finding to exist in `ROADMAP.md`, and after §9 only `REQ-107a` and
  `REQ-569` are there. T-IDs are unrestricted.
- P4c regenerate `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` and
  `spec/audit/req-coverage.md` (`npm run validate -- --write-register`).

### P5 — Gates and close

`npm run assemble` (when `spec/` changed) → **quote review**: every class (a) row's quoted
home line is re-read and confirmed to assert the Appendix F description, not merely to
mention the feature → `npm run check:fast` un-piped, exit code captured → `npm run test:all`
→ `aar.md` with the five-item disposition, the class counts, and the `## Changelog entry`
block → `npm run session:close --single`.

## Done bar

**Done bar (superseded for this increment by §9 — the bar in force is "6 citations closed, two
path defects fixed, 85 measured and split"):** all 91 findings carry a class in `tasks.md`, with per-class evidence — class
(a) quotes an existing home line, class (b) names the owning harness and carries a red read
when an assertion was authored, class (c) carries its `DECISIONS.md` procedure line; class
(a) is zero in a fresh `validate` run; every `cite` flag is fixed; the residual count
`N = b − authored`, where `b` is the class (b) count fixed at P1 and `authored` is the
number of class (b) rows whose assertion landed in P3b — no row is scheduled to reach the
bar, and no row is reclassified to rebalance it; no row whose description says "assert"
became `Manual`; `corpus.md` regenerates byte-identically; `spec/audit/req-coverage.md` is
regenerated and its freshness gate green; every class (a) quoted home line has been re-read
in P5 and marked `checked` in the table; `ROADMAP.md` states 91 → N and, when N > 0, names
every residue `(REQ, T-ID)` in at most three bullets; `ROADMAP` and the register subsection
are committed together; `check:fast` and `test:all` (56/56, or the updated count with
`AGENTS.md` moved in the same commit) green; one commit; AAR `LOOP PAUSED`. If N = 0, the
check is promoted to error-mode in the same commit (D4) and item 3 leaves `ROADMAP.md`.

## Verification

| # | Command | Expected |
|---|---|---|
| V1 | `npx tsx scripts/validate.ts > /tmp/rd4.txt; echo $?` | exit 0; `REQ evidence linkage: N finding(s)` where `N = b − authored`, both counts taken from `tasks.md` and stated in the AAR |
| V2 | `npx tsx scripts/validate.ts --write-linkage-corpus /tmp/corpus.md && diff /tmp/corpus.md docs/plans/2026-11-15-req-evidence-linkage/corpus.md` | empty diff |
| V3 | `npm run test:validators` | passes; count unchanged unless a case was added |
| V4 | `npm run check:fast` | trailing `check:fast: PASS`, 46+ passed, 0 failed |
| V5 | `npm run test:all` | all registered commands pass (56 today, or the updated count with `AGENTS.md:355`/`:371` moved in the same commit) — the suite that executes the edited harness files |
| V6 | `npm run check-registers` | PASS; every REQ named in the new register subsection resolves in `ROADMAP.md` (P4a ran first) |
| V7 | `npm run check-loop-artifacts` | 0 errors; AAR ends `LOOP PAUSED` |
| V8 | `npm run check-markers` and the coverage-register freshness check inside `validate` | PASS (P4c regenerated the register) |
| V9 (manual) | P5 re-reads every class (a) home line against its row description and marks the row `checked` in the P1 table | every class (a) row carries `checked`; no empty `home` cell in a class (a) row |
| V10 (informational) | `npx tsx scripts/spec-update-record.ts --check` | unchanged from baseline (the pre-publication state, EV6) |

## Open questions

The class (b) count is unknown until P1 runs, and it determines only the post-increment
count N and whether D4's promotion happens here — not whether the bar is met. P2–P5 need no
further decision.

## Risks

- **The label-gap assumption (EV4) may be wrong in bulk.** If P1 finds more (b) than (a),
  class (a) is trivially met while the item barely moves. The bar then reports N = the
  (b) count and the AAR says so; the plan does not reclassify rows to manufacture progress.
- **Editing 40+ harness test names widens every future diff.** Names are the evidence
  channel (`gatherExercisedIds`), so this is the intended cost; it was already paid 888
  times. V5 exists because a renamed test is executed only there.
- **A label on a test that asserts something else is the failure mode this bar cannot see.**
  Mitigation: the class (a) home line is quoted in the table and P5 checks every quoted line
  against the row description, not a sample.
- **Appendix F kind flips touch the coverage buckets.** V1's bucket line and the
  `exercised test IDs` count are recorded in the AAR; an unexplained move is a red flag.
- **`check:conformance` may react to a kind flip.** Probe it in P3 before committing; a
  bucket-C change is expected, a bucket-A change is not.
- **`check-roadmap`'s bullet budget.** The residue list must fit three bullets; group the
  pairs by T-ID family (e.g. "T497 across REQ-313b/313d/314a/314c/314d") rather than
  dropping any, so the done bar and the gate agree.

## Non-goals

- Publishing, the Spec Update entry, and the verifier dispatch — operator-owned (EV6).
- Any new admitted evidence shape (D1).
- Evidence granularity (`check:conformance --dedicated`, 126 advisory bucket-C REQs).
- Items 1, 2, 4, 5 beyond the disposition table.

---

## 9. Delta amendment (execution stop, 2026-11-16)

**What happened.** P1 ran and measured 91 rows over 81 distinct T-IDs. It also falsified the
plan's sizing assumption: the label channel is **narrower** than EV4 assumed. Root
`scripts/**` labels count only inside `function check*(…)` bodies, and `holonovel/scripts/**`
only from `test("<name>")`, so a message in a top-level script section
(`scripts/version-check.ts:133`, `scripts/surface-replay.ts:281`) cannot be labelled into
evidence at all. Each remaining row needs a per-row assertion read; the plan sized that "M".

**What the measurement settled.**

- Class (a) homes confirmed, labelled, and closed — **6 citations**: T17
  (`test-persistence.ts:772`), T88 (`test-persistence-guardrails.ts:446`),
  T421/T434/T435 (`validate.ts` `checkCouplingCompleteness`), T540
  (`validate.ts:1048`, `checkPatternBufferBlockingParity`). `validate` moved 91 → 85.
- Class (b) **proven**, not assumed: T420/T425/T439 require "≥1 archetype per group" and no
  check asserts non-emptiness (`validate.ts:1097` validates only unrecognised tokens).
- **Two predicate quirks measured** (worth a future chunk's attention): a report literal
  beginning with a `\n` escape is not collected (`labelsFromContent` dropped `T434` until
  the escape was removed), and a report in a *top-level* script section is unreadable —
  so T493 (`scripts/version-check.ts:133`) and T682 (`scripts/surface-replay.ts:281`) are
  not label-closeable at all.
- **Two citation defects fixed**: REQ-451's body and the T541/T542 rows now name
  `holonovel/scripts/…`; the rows stay class (b) (EV5).
- 85 rows remain; 78 were not individually read and are carried, not inferred (7 classified or
named: the five class (b) rows above plus T493/T682).

**Proposed split (the amendment).**

- **Chunk 4 (next session, the whole item):** the remaining 85 rows over 75 T-IDs, grouped
  by owner: the gate-side builder REQs (`checkPatternBufferCoverageMap`,
  `checkSection52CoverageMap`, `checkAppendixFAssertions`, `checkPhaseMapHash`,
  `checkConfigSurfaceParity`, `compare-spec-code`, `check-performance-record`,
  `check-tdqs-scoreboard`) and the server-runtime REQs (T4, T72, T73, T87, T106, T114,
  T184, T186, T187, T251, T301, T304, T308, T310, T360, T371, T379, T422, T426, T428,
  T432, T433, T436, T437, T438, T496, T541, T542). Bar: every row dispositioned and class
  (a) zero, as revision 4's bar already states.
- **The predicate quirks** become a named sub-item of chunk 4: either admit a top-level
  report shape or re-cite those rows.

**Bar status at stop (honest).** The revision-4 bar — class (a) zero across all 91 — is
**not met**: 6 citations closed, 85 carried. This amendment supersedes that bar for this
increment; the increment's claim is "6 citations closed, two path defects fixed, and the
remaining 85 measured and split", with the 85 scheduled on `ROADMAP.md` in the same commit.
The full bar returns, unchanged, as chunk 4.

**Status at stop:** `spec/08-synthesis.md` and `spec/appendices-reference.md` carry the
citation fix; two harness test names and four `validate` messages carry the labels; the
corpus and coverage register are regenerated; `validate` is 0 errors / 390 warnings / 85
linkage findings. The increment commits once, through `session:close --single`.

