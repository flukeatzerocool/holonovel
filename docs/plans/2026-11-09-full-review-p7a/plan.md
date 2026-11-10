# Plan — Full-review sweep, chunk P7a (determinism and knowledge artifacts)

**Status:** draft, scope approved by user (Q1 = split, P7a first) · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh — one cold pass (`independent-review passed.`,
4/5 stages; stage 4 N/A) plus one targeted diff re-review after the review
findings were applied; report `/tmp/opencode/p7a-cold/report.md`. Reviewed
pre-header text sha256
`3c686560db4d744cd1d37336d266f3cfad9f6dc04c364c10781dfcf187a0d133`; this
header is the only text added after that pass.
**Rollback cost:** 1 (2 if a C0 baseline fix lands first)
**Roadmap item:** `ROADMAP.md` § Remaining full-review sweep (P1)
**Predecessor:** `docs/plans/2026-11-09-full-review-p6b/` (chunk P6b, closed
2026-11-09, `LOOP PAUSED`)
**Tracker:** `docs/plans/2026-11-09-full-review-sweep/worklist.md`

## Review status

Drafted against the live tree. The roadmap's next scheduled item is chunk P7,
but the recorded P7 row is the largest remaining unit in the program:
`worklist.md:295` assigns it six code files and seven spec sections. Measured
this session, that is **280 REQs across 131 family rows** — more than P6a and
P6b combined (107/36 and 73/50), and more than double the chunk size the sweep
has been executing since P3. D61 split a smaller chunk (180 REQs / 86 rows) for
exactly this reason.

**Recommendation (Q1):** split P7 at the family boundary into two increments and
execute P7a first:

- **P7a — determinism and knowledge artifacts (this plan):** §5.7 determinism,
  safety, and performance (64 REQs / 33 family rows), §5.14 content sources
  (7 / 2), §5.28 knowledge corpus (9 / 9), §5.29 build-time semantic index
  (6 / 6), §5.30 knowledge-graph projection (5 / 5) = **91 REQs / 55 family
  rows**.
- **P7b — extraction and synthesis:** §5.2 extraction and confidence
  (58 / 37) and §5.8 synthesis, lore, and macros (131 / 39) = **189 REQs /
  76 family rows**. All 37 §5.2 family rows are bucket E (builder-side), so
  most P7b rows are dispositioned rather than exercised — but §5.8's 131 REQs
  over 39 rows is still a full session's review.

Depth is `standard`: the increment edits review records, registers, roadmap, and
changelog; it is reversible and performs no destructive, remote, or
schema-migration operation. A P0 fix could touch the RNG, the state hash, the
limit gate, or the knowledge handlers, which is why the plan fixes the harness
set in advance.

## Done bar

**Done bar:** this increment only — chunk P7a of the sweep program. The bar is
met when all nine items hold; anything else found is scheduled, not chased.

1. `docs/plans/2026-11-09-full-review-p7a/` carries `plan.md`, `tasks.md`, and
   `aar.md`, and `aar.md` ends in `LOOP PAUSED` or `LOOP OPEN`.
   `check-loop-artifacts` passes.
2. The sweep `worklist.md` holds a chunk P7a section with **one row per
   in-scope REQ — 91 rows**: every REQ header in §5.7 (64), §5.14 (7), §5.28
   (9), §5.29 (6), and §5.30 (5), enumerated in document order. The ranges are
   not contiguous — §5.7 interleaves its families and its last header is
   `REQ-621a` — so the enumeration command is `grep -n '^\*\*REQ-'` over each
   section range, re-derived at Phase 0 step 8. Each row carries its bucket
   inherited from the base family row in `spec/audit/req-coverage.md` and a
   verdict of `holds`, `finding:<ID>`, `builder-side`, or `deferred:<chunk>`.
3. The same section holds a **code-surface table of at least twelve behaviour
   rows**: RNG seeding and session determinism, state-hash canonicalization and
   the exclusion list, the limit caps and their refusal shape, snapshot depth,
   `TTRPG_SEED` override, the no-network and path-containment guards, input
   safety, durability, supplementary import/remove/re-resolve, corpus
   register/access/consume and the retention cap, semantic index build/staleness/
   ranking/scope, and graph projection/idempotency/badge visibility. Each row
   carries a `file:line` anchor, the carrying evidence, and a verdict. A finding
   ID is `F-P7a-N`, N restarting at 1 and shared across severities. Table shape
   is the P5/P6 one: `Behaviour | Anchor | Harness | Verdict`; behaviour
   verdicts use the same vocabulary as REQ rows; cluster verdicts
   `Cluster | REQs | Verdict | Evidence`.
4. Every `finding:<ID>` names a `file:line` or `spec:line` predicate and a
   P-severity, and has a terminal disposition (`Resolved` ·
   `Scheduled-roadmap` · `Closed-P3` · `Deferred-by-user`), recorded as
   `finding:F-P7a-N (P0|P1|P2|P3)`; a P0 fixed in-session reads
   `finding:F-P7a-N (P0, resolved in-session)`.
5. Zero open P0 findings remain. A P0 that cannot be fixed inside the session
   stops the run and still lands as a record (see **Stopped-run landing**).
6. Each of the four clusters (A–D below) has a recorded verdict, and a cluster
   verdict is the worst-of its own REQ rows under the order `finding` >
   `deferred` > `builder-side` > `holds` (within `finding`, the highest
   severity wins; ties go to the lowest `F-P7a-N`). Every REQ has exactly one
   owning cluster.
7. `spec/audit/review-register.md` carries every P7a finding under the section
   its disposition names; no `Scheduled-roadmap` row is written without its
   matching `ROADMAP.md` entry, and every `REQ-NNN` token in a
   `Scheduled-roadmap` row appears literally in `ROADMAP.md`
   (`scripts/lib/register-checks.ts`, enforced by
   `npm run check-registers:strict`).
8. `ROADMAP.md` is updated in the same increment: the sweep section names the
   remaining chunks P7b, P8, and the closing M1 re-run, retains the scope
   clause, and its `**Trigger:**` names chunk P7b on a closed run (or the P0 /
   chunk P7a resume on a halt), keeping the admission shape (1–3 bullets +
   `**Trigger:**`).
9. These exit 0 un-piped: `npm run assemble`, `npm run check:fast`,
   `npm run check`, `npm --prefix holonovel run test:all`, and the targeted
   harnesses named in **Verification** that are not reached by `test:all`. The
   increment is one commit, subject derived by `npm run session:close` from the
   `CHANGELOG.md` heading; a conditional C0 baseline fix precedes it as its own
   commit. No push.

## Open questions (answers recorded as decisions before execution)

- **Q1 — Split P7, and in which order?** Measured: whole P7 is 280 REQs /
  131 family rows over seven sections. **Decided (user, 2026-11-09):** split at
  the family boundary into P7a (determinism and knowledge artifacts, 91 REQs /
  55 rows) and P7b (§5.2 + §5.8, 189 REQs / 76 rows); execute P7a first because
  its code surface is the six files the worklist already names,
  `core/rng.ts`, `state-hash.ts`, `limits.ts`, `corpus.ts`, `semantic.ts`,
  `graph.ts` (556 lines total), and the P4/P5 boundary rulings already forward
  here (D48, D56). Record as D81 at Phase 0. A time-boxed partial landing
  exists if the session runs out.
- **Q2 — Fix policy.** D2/D13/D62 unchanged: P0 fixed in-session (bounded), P1
  scheduled on `ROADMAP.md`, P2 fixed only on a demonstrated failure, P3
  record-and-close. **Recommendation:** adopt.
- **Q3 — Increment record.** New directory
  `docs/plans/2026-11-09-full-review-p7a/`; the sweep `worklist.md` stays the
  cross-session tracker and carries the P7a tables and decisions D81 onward
  (D80 is the last recorded). **Recommendation:** yes.
- **Q4 — Bucket resolution.** Resolve by base family ID from
  `spec/audit/req-coverage.md`, never by section membership. Measured this
  session: §5.7 thirty-three rows — twenty-eight bucket C and `REQ-100`,
  `273`, `274`, `416`, `619` bucket E; §5.14 `REQ-372` bucket C and `REQ-373`
  bucket E; §5.28, §5.29, and §5.30 twenty rows all bucket C. That is 49
  bucket-C rows and 6 bucket-E rows for P7a. Re-verify at Phase 0.
  **Recommendation:** yes.
- **Q5 — Boundaries (one rule, no overlap).** P7a owns the determinism
  primitives (RNG seeding, state-hash canonicalization, the env-driven limit
  caps), the supplementary-import runtime path (§5.14), the corpus store, the
  semantic index, and the knowledge-graph projection. Boundaries: (a) §5.2
  extraction and §5.8 synthesis/lore/macros → P7b; (b) ruleset package
  emission, install, and `tools/list` pagination stay with the closed P6b
  findings and their remediation sections — §5.14 is reviewed here only for
  its content-source, hash-recording, and re-resolve predicates, and a
  package-build defect is cross-referenced, not re-filed; (c) `core/state.ts`
  storage mechanics → P4 (`Closed-P3`); (d) narrative cognition → P8, which
  owns §5.12, §5.25–§5.27, and §5.32–§5.35 — §5.7 is reviewed here in full
  regardless of subject, including the REQ-312 cognition-adjacent rows;
  (e) hash canonicalization had been deferred from P4/P5 to P7 by D48/D56 and
  is in scope here. **Recommendation:** adopt.
- **Q6 — Row precedence.** `finding` > `deferred` > `builder-side` > `holds`;
  a resolved finding counts as `holds` for the cluster aggregate; cluster
  verdicts are worst-of. **Recommendation:** adopt.
- **Q7 — Citation resolution.** Own `_Check:_` IDs; family inheritance when
  absent; an `Automated` token must appear literally in a harness whose body
  exercises the behaviour; `Manual`, `Gate`, and scenario citations need none;
  `T0nn` titles are shadowing, not evidence. **Recommendation:** adopt
  (D10/D25/D49/D67/D77).
- **Q8 — Fingerprint consequence.** `DATA_SECTIONS` includes §5.28
  (`scripts/lib/contract-fingerprint.ts:37-43`) but not §5.7, §5.14, §5.29, or
  §5.30; `PACKAGE_SECTIONS` is §5.16/§5.17/§6.3/§6.4.2 and does not intersect
  P7a. A REQ-body edit in §5.28 requires `npm run build-order`; edits in the
  other four sections need `assemble` + `--write-register` only. A review-only
  increment that changes no REQ body still runs `build-order` for version sync.
  **Recommendation:** adopt.
- **Q9 — Baseline and publication.** 17 commits are unpushed at drafting time
  and the working tree is clean. **Recommendation:** no push in this increment;
  publication stays user-authorized (D4).
- **Q10 — Session cap.** Whole-chunk execution with a declared halt rule: if
  Phase 1 has not closed clusters A–D by the session's review budget, land the
  completed clusters, mark the rest `deferred:P7a-resume`, and keep the run
  honest rather than thinning verdicts. **Recommendation:** adopt.

## Scope

**In scope.** Chunk P7a only: §5.7, §5.14, §5.28, §5.29, §5.30 (91 REQs /
55 family rows); the six determinism/knowledge files and the handler surface
that exposes them; citation resolution; findings, registers, roadmap, changelog.

**Out of scope.** P7b (§5.2, §5.8), chunk P8, the M1 re-run; §5.16–§5.18
package mechanics (P6b, closed); §5.9/§5.19 semantic review (seam pass, closed);
publication; version release notes.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | P7 as recorded = 280 REQs / 131 family rows across §5.2, §5.7, §5.8, §5.14, §5.28–§5.30 | `spec/02-requirements.md` REQ headers + `spec/audit/req-coverage.md`, counted this session | repo |
| EV2 | P7a slice = 91 REQs / 55 family rows (§5.7 64/33; §5.14 7/2; §5.28 9/9; §5.29 6/6; §5.30 5/5) | same count, this session | repo |
| EV3 | Buckets for P7a: 49 bucket C / 6 bucket E family rows | `spec/audit/req-coverage.md` | repo |
| EV4 | Code targets are small: `rng.ts` 91, `state-hash.ts` 64, `limits.ts` 47, `corpus.ts` 81, `semantic.ts` 148, `graph.ts` 125 — 556 lines | `wc -l` | repo |
| EV5 | Adjacent surfaces not in the worklist row but exercised by §5.14/§5.28: `core/macros.ts` 55, `core/wisdom.ts` 495; handlers `manage_lore` (`index.ts:6908`), `manage_corpus` (`:7227`), `manage_knowledge` (`:8982`), `manage_synthesis` (`:13540`) | `wc -l`, `grep -n` | repo |
| EV6 | Existing harnesses: `test:corpus`, `test:index`, `test:graph`, `test:limits`, `test:supplementary`, `test-fingerprints`, `test-holosuite-evidence`; `test:all` runs `run-test-suite.ts` | `holonovel/package.json:72,81,105-108,119`, `ls holonovel/scripts` | repo |
| EV7 | `review-register.md` carries no `F-P7` finding yet; the last P6b ID is `F-P6b-26` | `grep` | repo |
| EV8 | P4 forwarded determinism and P5 forwarded hash canonicalization to P7 (D48, D56) | `worklist.md:160-200` | repo |
| EV9 | 17 commits unpushed, working tree clean at drafting | `git rev-list --count origin/main..HEAD`, `git status --porcelain` | tool output, this session |
| EV10 | `DATA_SECTIONS` includes §5.28, excludes §5.7/§5.14/§5.29/§5.30; `PACKAGE_SECTIONS` excludes all five | `scripts/lib/contract-fingerprint.ts:27,37-43` | repo |

## The chunk's review surface — four clusters

Cluster assignment is disjoint and covers all 91 REQs.

- **A — Determinism and safety (§5.7, 64 REQs / 33 family rows).** `core/rng.ts`
  seeding and session determinism, `core/state-hash.ts` canonicalization and
  `STATE_HASH_EXCLUDED_KEYS`, `core/limits.ts` caps and refusal shape, the
  no-network, path-containment, input-safety, durability, and performance
  contracts, and the REQ-444–449/REQ-615–621 access and budget rows.
- **B — Content sources (§5.14, 7 REQs / 2 family rows).** Supplementary
  ruleset import, hash recording, `[supplementary-gap]` re-resolve, removal
  semantics, and dynamic tool registration/deregistration.
- **C — Knowledge corpus (§5.28, 9 REQs / 9 family rows).** `core/corpus.ts`,
  `manage_corpus`/`manage_lore` handlers: registration, routing, access
  predicate, consumption modes and ledger, cold-until-consumed, deixis, badge
  gating, retention cap.
- **D — Semantic index and knowledge graph (§5.29+§5.30, 11 REQs / 11 family
  rows).** `core/semantic.ts` and `core/graph.ts`, `manage_knowledge`:
  offline build, fingerprint staleness, advisory ranking and relations,
  authority boundary, badge scope filtering, projection typing/edges/
  idempotency/read-only exposure.

## Steps

### Phase 0 — Baseline (planning record only; a C0 source fix is a separate commit)

1. Run `npm run check:fast` and `npm run check` un-piped; record exit status
   and the trailing `PASS`/`FAIL` line. A red baseline is a gate defect: fix it
   as its own commit (C0) before any review work, per the standing route.
2. Create `tasks.md` and a provisional `aar.md` (status `in progress`) in the
   increment directory before the first review step.
3. Run `npm --prefix holonovel run test:all`; record the per-harness summary.
   Run the P7a-specific harnesses (`test:corpus`, `test:index`, `test:graph`,
   `test:limits`, `test:supplementary`, `test:fingerprints`) and record whether
   each is already reached by `test:all`.
4. Record `git status --porcelain`, `git rev-parse --short HEAD`, and
   `origin/main..HEAD`; confirm the cold-pass report is at
   `/tmp/opencode/p7a-cold/` and the evidence sidecar under
   `~/.local/state/opencode/plans/`, both outside the repo.
5. Confirm `git check-ignore -v docs/plans/2026-11-09-full-review-p7a/` returns
   nothing.
6. Record Q1–Q10 as D81–D90 in the sweep worklist, including the split decision
   and the P7b scope so the roadmap edit is unambiguous.
7. Write the plan-gate preflight evidence sidecar.
8. Re-derive the 91-REQ / 55-family-row set and its buckets with
   `grep -n '^\*\*REQ-'` over each section range; stop and re-stamp on a
   verified mismatch.

### Phase 1 — Code side (read-only review)

1. **Enumerate the surface** with `file:line` anchors: every export of the six
   files, the `TTRPG_SEED` read path, `STATE_HASH_EXCLUDED_KEYS` and the
   projection version, the `envInt` readers and cap refusal, the
   `manage_corpus`/`manage_knowledge`/`manage_lore` action branches, the
   supplementary import/remove branch, and the synthesis path that consumes
   `core/wisdom.ts`.
2. **Review cluster A** against §5.7: determinism (seed handling, tie-breaking,
   stable ordering), the no-network boundary, path containment, input safety,
   durability, and the O(n) and cap behaviours the section names.
3. **Review cluster B** against §5.14, cross-referencing the closed P6b ruleset
   findings rather than re-filing them.
4. **Review cluster C** against §5.28: the access predicate's deny-overrides
   rule, cold-until-consumed, ledger completeness, retention eviction order,
   and badge gating.
5. **Review cluster D** against §5.29/§5.30: offline construction, fingerprint
   staleness, deterministic ranking under ties, advisory-only authority,
   scope filtering, projection idempotency, and read-only exposure.
6. **Open every cited harness** and record exercise, not token presence.
7. **Record** 91 REQ verdicts, the behaviour table, and four cluster verdicts.

### Phase 2 — Spec side (citation resolution)

1. Resolve every `_Check:_` citation for the 91 rows using the P2/P3b/P4/P5/P6
   method (Q7).
2. Classify citation kind; record `Automated` tokens with no exercising
   harness as findings.
3. Fill bucket and verdict columns for all 91 rows.

### Phase 3 — Triage, registers, roadmap, artefacts

1. **Triage findings P0–P3** per Q2. A P0 fix lands with a targeted assertion;
   if it edits a REQ body, apply Q8's fingerprint rule.
2. **`spec/audit/review-register.md`**: one dated heading per used disposition
   section, rows per **Register write-back**.
3. **`ROADMAP.md`**: keep the sweep item's 1–3 bullet + `**Trigger:**` shape
   and update it to chunk P7b, chunk P8, and the closing M1 re-run, retaining
   the scope clause. When triage produces scheduled findings, add remediation
   section(s) of 1–3 bullets split by theme, every bullet naming its
   `REQ-NNN` IDs; when triage produces none, add no second section.
4. **`CHANGELOG.md`**: one dated heading
   `<YYYY-MM-DD> — Full-review sweep: chunk P7a (determinism and knowledge
   artifacts)`. Verify the CalVer date at execution.
5. **Artefacts**: tick `tasks.md`, replace the provisional `aar.md` with the
   execution record and the token the outcome earns, and update the sweep
   worklist's status table (P7 split into P7a closed-or-halted and P7b
   scheduled).
6. Run the verification table; commit per the plan's commit order.

## Register write-back

| Disposition | Section | Row shape |
|---|---|---|
| `Resolved` | first `## Resolved` block (`review-register.md:12`), newest-first | `### <date> full-review sweep — chunk P7a`; bullet `**F-P7a-N — <title> (resolved <YYYY-MM-DD>):**` + predicate + the REQ IDs it covers + fix location + the assertion that now covers it (or `no new assertion`) |
| `Scheduled-roadmap` | `## Scheduled-roadmap` | same heading; bullet names the finding, the predicate, the REQ IDs it covers (including lowercase suffixes), and the `ROADMAP.md` section it is scheduled under, plus the date; each cited `REQ-NNN` also appears literally in that `ROADMAP.md` section |
| `Closed-P3` | `## Closed-P3 (recorded, no action)` | same heading; bullet records the predicate, the REQ IDs, and why no action follows |
| `Deferred-by-user` | `## Deferred-by-user` | only on an explicit user deferral; names the decision |

## Stopped-run landing

If a P0 cannot be fixed within the session, the run halts and still lands as a
record:

1. `worklist.md` marks chunk P7a `halted on <finding ID>` and keeps the partial
   tables.
2. `ROADMAP.md` gains a section for the P0: heading
   `## <finding ID> — <title> (P0)`, 1–3 bullets naming the predicate, the
   reproduction, and the finding's `REQ-NNN` IDs, and a `**Trigger:**` line;
   the admission rule and the strict REQ-literal rule both apply.
3. `CHANGELOG.md` heading reads
   `<date> — Full-review sweep: chunk P7a (halted on <finding ID>)`.
4. The unfixed P0 is a `Scheduled-roadmap` row whose matching `ROADMAP.md`
   entry is the P0 section. A baseline P0 is a gate defect and gets no register
   row.
5. `aar.md` ends `LOOP OPEN` naming the P0 row; gates still run.
6. The roadmap scope clause records "chunk P7a halted", never "closed".
7. No push. The P0 is the next session's first item, ahead of chunk P7b.

**Red-baseline branch.** When the unfixable P0 is the baseline itself: record
the red output verbatim in `aar.md` (`LOOP OPEN`), add
`## Baseline red — <gate> (halted)` to `ROADMAP.md`, write no `CHANGELOG`
entry, stage only the planning record, and commit manually with
`--no-verify` because the pre-commit hook cannot pass on a tree that is red by
construction. The run does not claim green gates.

## Blast radius

- **P0 fix in cluster A** (`core/rng.ts`, `core/state-hash.ts`, `core/limits.ts`):
  every persisted Novel and every determinism assertion is downstream. The
  state-hash projection version is part of the contract; changing it requires
  the fingerprint and persistence gates, not just the harness.
- **P0 fix in cluster B** (`manage_ruleset` supplementary branch in
  `holonovel/src/index.ts`, `core/state.ts` supplementary fields): touches the
  dynamic tool registry; the P6b surface gates (`check-tool-surface`,
  `surface-budget`, `action-conflicts`, `test:ruleset-*`) apply.
- **P0 fix in cluster C/D** (`core/corpus.ts`, `core/semantic.ts`,
  `core/graph.ts`, the `manage_corpus`/`manage_knowledge`/`manage_lore`
  handlers, `core/wisdom.ts` where synthesis consumes the derived artifacts):
  `test:corpus`, `test:index`, `test:graph`, and the badge-filter assertions
  apply.
- **Version sync (every run).** `npm run build-order` runs the version-bump
  step unconditionally (`scripts/build-order.ts:251-254`); with the dated
  `CHANGELOG.md` heading this increment writes, the CalVer advances and the step
  rewrites `holonovel/package.json`, `holonovel/DECISIONS.md`
  (spec-hash line), `holonovel/src/index.ts` (version banner), `server.json`,
  the lockfile, and the README `@spec:` markers. Those files are expected
  targets, not drift; a version bump is expected on the commit.

## Considered and rejected

- **Execute whole P7 in one increment.** Rejected: 280 REQs / 131 family rows,
  over twice the largest sustained chunk, with two different code families
  (determinism primitives and narrative synthesis). A single session would thin
  verdicts to meet the bar.
- **Split by spec section count rather than family.** Rejected: family rows are
  the review unit; splitting a family across chunks breaks bucket inheritance
  and the disjoint-cluster invariant.
- **Fold §5.14 into the closed P6b increment.** Rejected: P6b is closed with its
  own commit and AAR; §5.14's content-source predicates are recorded against
  P7a for traceability, and re-opening P6b would break the one-increment-one-
  commit rule.
- **Skip §5.2 as all builder-side.** Rejected for P7: it is a named sweep
  surface; the verdicts are cheap but the citation resolution is real work.

## Verification

| Check | Command | Expected |
|---|---|---|
| Assembly | `npm run assemble` | exit 0 |
| Fast gate | `npm run check:fast` un-piped | trailing `check:fast: PASS` |
| Full gate | `npm run check` un-piped | trailing `check: PASS` |
| Server suite | `npm --prefix holonovel run test:all` | all harnesses PASS |
| Corpus | `npm --prefix holonovel run test:corpus` | PASS |
| Semantic index | `npm --prefix holonovel run test:index` | PASS |
| Knowledge graph | `npm --prefix holonovel run test:graph` | PASS |
| Limits | `npm --prefix holonovel run test:limits` | PASS |
| Supplementary | `npm --prefix holonovel run test:supplementary` | PASS |
| Fingerprints | `npm --prefix holonovel run test:fingerprints` | PASS |
| Registers | `npm run check-registers:strict` | PASS |
| Roadmap | `npm run check-roadmap` | PASS |
| Loop artifacts | `npm run check-loop-artifacts` | PASS |
| Version sync | `npm run build-order` | PASS (REQ-body change or version sync) |

## Risks and rollback

- **Risk — review fatigue produces uncited `holds`.** Mitigation: the done bar
  requires a behaviour-table row with a `file:line` anchor for every cluster,
  and cluster verdicts are worst-of their rows.
- **Risk — §5.14 re-litigates P6b.** Mitigation: Q5(b); a package-build defect
  is cross-referenced to the P6b finding, not re-filed.
- **Risk — a P0 in `state-hash.ts` invalidates persisted Novels.** Mitigation:
  the projection version is treated as contract; the fix lands with the
  migration/version decision recorded as a finding before the code change.
- **Rollback:** the increment is review records plus at most a bounded P0 fix.
  Revert is one `git revert` of the single commit (plus the optional C0).

## Commit order and gates

1. **C0 (conditional)** — baseline fix as its own commit, run per the standing
   route. Only when Phase 0 is red.
2. **C1** — the review increment: worklist tables, findings, register rows,
   roadmap, changelog, plan/tasks/AAR. One commit, subject derived by
   `npm run session:close` from the top `CHANGELOG.md` heading.

No push. `push-pipeline.sh` stays user-authorized (D4).

## User impact

None at runtime: this increment records review verdicts and schedules
remediation. If a P0 lands, the affected surface is named in the changelog and
the AAR.

## Evidence

Phase 0–3 fill the verified evidence into `tasks.md` and `aar.md`. The numbers
in EV1–EV3 are the drafting measurements and are re-derived at Phase 0 step 8
before execution.
