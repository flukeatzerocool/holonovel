# Plan — Full-review sweep, chunk P7b (extraction and synthesis)

**Status:** approved by user (2026-11-09), executing · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh — one cold pass (`independent-review passed.`,
4/5 stages; stage 4 N/A) at `/tmp/opencode/p7b-cold/report.md`, then one
targeted diff re-review of the applied findings (`diff re-review passed.`).
The cold pass raised 0 blockers and 3 majors; all three are applied and
confirmed, together with its minor findings and the re-review's seven
follow-ups.
**Rollback cost:** 1 (2 if a C0 baseline fix lands first)
**Roadmap item:** `ROADMAP.md` § Remaining full-review sweep (P1)
**Predecessor:** `docs/plans/2026-11-09-full-review-p7a/` (chunk P7a, closed
2026-11-09, `LOOP PAUSED`)
**Tracker:** `docs/plans/2026-11-09-full-review-sweep/worklist.md`

## Review status

Drafted against the live tree. Chunk P7b is the next scheduled unit: the
roadmap's `**Trigger:**` names it explicitly, and the P7a decision record (D81)
fixes its boundary at §5.2 plus §5.8, measured this session at **189 REQs
across 76 family rows** — §5.2 is 58 REQs / 37 rows and §5.8 is 131 REQs / 39
rows. That is roughly twice P7a's REQ count (91) on a 38% larger row count
(55), which is why Q10 fixes a halt rule in advance rather than thinning
verdicts under time pressure.

The two halves are not equal work:

- **§5.2 is structurally cheap.** All 37 family rows are bucket E (intended
  gap, builder-side), the section already carries an evidence-surface coverage
  map mechanically enforced by `checkSection52CoverageMap`
  (`scripts/validate.ts:971`), and its conversion evidence is gated by
  `check:conversion-evidence`. Most rows should land as `builder-side` after a
  citation-kind check; the real work is confirming that each row's cited
  surface exists and that no row was silently reclassified server-side.
- **§5.8 is the session's substance.** 131 REQs over 39 rows, 32 of them bucket
  C (cited plus exercised): the story journal, campaign memory, the synthesis
  engine, prompt composition and section tokens, dynamic lore, action
  suggestions, macros, scene tagging, and the ruling ledger. Its code surface
  is `holonovel/src/core/wisdom.ts` (495 lines),
  `holonovel/src/core/prompt-composition.ts` (349),
  `holonovel/src/core/memory.ts` (184), `holonovel/src/core/macros.ts` (55),
  and the handlers `manage_synthesis` (`index.ts:13540`), `manage_story`
  (`:7965`), `manage_lore` (`:6908`), and `manage_scene` (`:6215`).

**Drafting signal, not a verdict.** A grep of the five harnesses adjacent to
§5.8 (`test:narrative`, `test:memory-recall`, `test:lean-narrator`,
`test:briefing`, `test:selection`) finds **zero** occurrences of `synthesis`.
The engine is implemented in `core/wisdom.ts` and dispatched from
`manage_synthesis`, so the likely finding class is citation
mis-attribution — `Automated` tokens whose harness exercises a neighbouring
behaviour. The review must confirm or refute this per row; nothing here
pre-files a finding.

## Done bar

**Done bar:** this increment only — chunk P7b, and with it the last review chunk
before P8. The bar is met when all nine items hold; anything else found is
scheduled, not chased.

1. `docs/plans/2026-11-09-full-review-p7b/` carries `plan.md`, `tasks.md`, and
   `aar.md`, and `aar.md` ends in `LOOP PAUSED` or `LOOP OPEN`.
   `check-loop-artifacts` passes.
2. The sweep `worklist.md` holds a chunk P7b section with **one row per in-scope
   REQ — 189 rows**: every REQ header in §5.2 (58) and §5.8 (131), enumerated in
   document order. The ranges are not contiguous — §5.2 ends at `REQ-551a` and
   §5.8 opens at `REQ-246b1` — so the enumeration command is
   `grep -n '^\*\*REQ-'` over each section range, re-derived at Phase 0 step 8.
   Each row carries its bucket inherited from the base family row in
   `spec/audit/req-coverage.md` and a verdict of `holds`, `finding:<ID>`,
   `builder-side`, or `deferred:<chunk>`, where `<ID>` is written
   `F-P7b-N (P<n>)` — one shape for the token everywhere it appears.
3. The same section holds a **code-surface table of sixteen behaviour
   rows**: conversion-evidence verification and the §5.2 coverage map, the
   vendor-manifest surface, story-journal capture and surfacing,
   journal-to-lore promotion, campaign-memory accumulation and retrieval,
   synthesis boundaries and the citation-verification obligation, the synthesis
   model and confidence model, synthesis activation and reversion, the
   convergence cache key and pre-computed manifest, prompt section ordering and
   section-token vocabulary, dynamic lore and sticky-counter decay,
   lore-world coupling, action suggestions and pattern activation, macros and
   audit compression, scene tagging and the scene-transition hook, and the
   ruling ledger. Each row carries a `file:line` anchor, the carrying evidence,
   and a verdict. Table shape is the P5/P6 one: `Behaviour | Anchor | Harness |
   Verdict`; cluster verdicts `Cluster | REQs | Verdict | Evidence`.
4. Every `finding:<ID>` names a `file:line` or `spec:line` predicate and a
   P-severity, and has a terminal disposition, recorded as
   `finding:F-P7b-N (P0|P1|P2|P3)`; a P0 fixed in-session reads
   `finding:F-P7b-N (P0, resolved in-session)`.
5. Zero open P0 findings remain. A P0 that cannot be fixed inside the session
   stops the run and still lands as a record (see **Stopped-run landing**).
6. Each of the five clusters (A–E below) has a recorded verdict, and a cluster
   verdict is the worst-of its own REQ rows under the order `finding` >
   `deferred` > `builder-side` > `holds` (within `finding`, the highest
   severity wins; ties go to the lowest `F-P7b-N`). Every REQ has exactly one
   owning cluster.
7. `spec/audit/review-register.md` carries every P7b finding under the section
   its disposition names; no `Scheduled-roadmap` row is written without its
   matching `ROADMAP.md` entry, and every `REQ-NNN` token in a
   `Scheduled-roadmap` row appears literally in `ROADMAP.md`
   (`scripts/lib/register-checks.ts`, enforced by
   `npm run check-registers:strict`).
8. `ROADMAP.md` is updated in the same increment: the sweep section names the
   remaining chunk P8 and the closing M1 re-run (chunk P7b drops out), retains
   the scope clause, and its `**Trigger:**` names chunk P8 on a closed run (or
   the P0 / chunk P7b resume on a halt), keeping the admission shape (1–3
   bullets + `**Trigger:**`).
9. These exit 0 un-piped: `npm run assemble`, `npm run check:fast`,
   `npm run check`, `npm --prefix holonovel run test:all`, and the targeted
   harnesses named in **Verification** that are not reached by `test:all`. The
   increment is one commit, subject derived by `npm run session:close` from the
   `CHANGELOG.md` heading; a conditional C0 baseline fix precedes it as its own
   commit. No push.

## Open questions (answers recorded as decisions before execution)

- **Q1 — Execute P7b whole, or split §5.2 from §5.8?** Measured: 189 REQs / 76
  rows. §5.2's 37 rows are all bucket E and rule-checked by an existing gate;
  §5.8's 39 rows carry the review. **Recommendation:** one increment. Splitting
  would strand a session on disposition work, and the §5.2 half is the cheap
  verification that the row is still legitimately builder-side.
- **Q2 — Fix policy.** D2/D13/D62 unchanged: P0 fixed in-session (bounded), P1
  scheduled on `ROADMAP.md`, P2 fixed only on a demonstrated failure, P3
  record-and-close. **Recommendation:** adopt.
- **Q3 — Increment record.** New directory
  `docs/plans/2026-11-09-full-review-p7b/`; the sweep `worklist.md` stays the
  cross-session tracker and carries the P7b tables and decisions D91 onward
  (D90 is the last recorded). **Recommendation:** yes.
- **Q4 — Bucket resolution.** Resolve by base family ID from
  `spec/audit/req-coverage.md`, never by section membership. Measured this
  session: §5.2 thirty-seven rows all bucket E; §5.8 thirty-two bucket C and
  seven bucket E (`REQ-114`, `REQ-130`, `REQ-158`, `REQ-228`, `REQ-243`,
  `REQ-244`, `REQ-245`). That is 32 bucket-C rows and 44 bucket-E rows for P7b.
  Re-verify at Phase 0. **Recommendation:** yes.
- **Q5 — Boundaries (one rule, no overlap).** (a) §5.7 determinism and
  §5.28–§5.30 knowledge artifacts belong to the closed P7a. (b) Narrative
  cognition (§5.12, §5.25–§5.27, §5.32–§5.35) → P8; §5.8's prompt-composition
  and narrative-directive rows are reviewed here in full regardless of
  cognition adjacency. (c) Package emission, install, and `tools/list`
  pagination stay with the closed P6b findings and their remediation sections —
  a package-build defect is cross-referenced, not re-filed. (d) §5.2 is
  reviewed for the coverage-map, conversion-evidence, and vendor-integrity
  predicates, not for converter implementation, which is builder-side. (e)
  Story-journal and campaign-memory persistence semantics are reviewed here;
  storage mechanics in `holonovel/src/core/state.ts` → P4 (`Closed-P3`). (f)
  REQ ownership is disjoint, but the file surface overlaps P8: P8's worklist
  row lists `holonovel/src/core/memory.ts`, which this chunk reads for §5.8
  predicates. A defect in a P8-owned behaviour is cross-referenced, not
  re-filed. **Recommendation:** adopt.
- **Q6 — Row precedence.** `finding` > `deferred` > `builder-side` > `holds`;
  a resolved finding counts as `holds` for the cluster aggregate; cluster
  verdicts are worst-of. **Recommendation:** adopt.
- **Q7 — Citation resolution.** Own `_Check:_` IDs; family inheritance when
  absent; an `Automated` token must appear literally in a harness whose body
  exercises the behaviour; `Manual`, `Gate`, and scenario citations need none;
  `T0nn` titles are shadowing, not evidence. **Recommendation:** adopt
  (D10/D25/D49/D67/D77).
- **Q8 — Fingerprint consequence.** Neither §5.2 nor §5.8 appears in
  `DATA_SECTIONS` or `PACKAGE_SECTIONS` (`scripts/lib/contract-fingerprint.ts`).
  A REQ-body edit in either section needs `assemble` + `--write-register` only;
  a review-only increment that changes no REQ body still runs `build-order`
  for the fingerprint and marker steps, whose version bump is a no-op at
  today's CalVer. **Recommendation:** adopt.
- **Q9 — Baseline and publication.** 18 commits are unpushed at drafting time.
  `check:fast` measured 37/37 PASS on a tree clean at `ee930b8`; the only
  change since is this increment's untracked directory, which is not a
  baseline defect. **Recommendation:** no push in this increment; publication
  stays user-authorized (D4).
- **Q10 — Session cap.** Whole-chunk execution with a declared halt rule: if
  Phase 1 has not closed clusters A–C by the session's review budget, land the
  completed clusters, mark the rest `deferred:P7b-resume`, and keep the run
  honest rather than thinning verdicts. A deferral-halt ends `LOOP OPEN` (an
  unreviewed cluster remains), the AAR names every unreviewed cluster and the
  resume point, and the roadmap trigger names that resume. **Recommendation:**
  adopt.

## Scope

**In scope.** Chunk P7b only: §5.2 and §5.8 (189 REQs / 76 family rows); the
synthesis, prompt-composition, journal, memory, and macro surfaces plus the
handlers that expose them; citation resolution; findings, registers, roadmap,
changelog.

**Out of scope.** Chunk P8 and the closing M1 re-run; §5.7/§5.28–§5.30 (P7a,
closed); §5.16–§5.18 package mechanics (P6b, closed); §5.9/§5.19 (seam pass,
closed) — except for the single §5.19 enumeration clause a P0-forced new state
surface requires under **Blast radius**; publication; version release notes.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | §5.2 = 58 REQs / 37 family rows; §5.8 = 131 REQs / 39 family rows; P7b = 189 / 76 | REQ headers in `spec/02-requirements.md` (§5.2 lines 249–613, §5.8 lines 2519–2882), counted this session | repo |
| EV2 | §5.2 buckets: 37 E / 0 C. §5.8 buckets: 32 C / 7 E (`REQ-114`, `130`, `158`, `228`, `243`, `244`, `245`). P7b totals 32 C / 44 E | `spec/audit/req-coverage.md`, aggregated by section column this session | repo |
| EV3 | Cluster split: A 58/37, B 15/4, C 65/18, D 12/4, E 39/13; disjoint and complete | REQ-family grouping, counted this session | repo |
| EV4 | Code targets: `holonovel/src/core/wisdom.ts` 495, `core/prompt-composition.ts` 349, `core/memory.ts` 184, `core/macros.ts` 55; handlers `manage_synthesis` `index.ts:13540`, `manage_story` `:7965`, `manage_lore` `:6908`, `manage_scene` `:6215`; `index.ts` 14 819 lines | `wc -l`, `grep -n` | repo |
| EV5 | §5.2 already has a mechanical evidence gate: `checkSection52CoverageMap` (`scripts/validate.ts:971`), wired into `validate` | `grep -n` | repo |
| EV6 | Conversion evidence is gated by `check:conversion-evidence` (`holonovel/package.json:114`), reached by `test:all` (`holonovel/scripts/run-test-suite.ts:81`); vendor integrity by `check:vendor` (`:80`) | `package.json`, `run-test-suite.ts` | repo |
| EV7 | Existing §5.8-adjacent harnesses: `test:narrative`, `test:memory-recall`, `test:lean-narrator`, `test:briefing`, `test:selection`; none contains `synthesis` | `grep -ci` over `holonovel/scripts/` | repo |
| EV8 | `review-register.md` carries no `F-P7b` finding; the last P7 ID is `F-P7a-3` | `grep` | repo |
| EV9 | 18 commits unpushed; working tree clean at `ee930b8` before this increment's directory existed; `check:fast` 37/37 PASS on that tree | `git rev-list --count origin/main..HEAD`, `git status --porcelain`, gate run | tool output, this session |
| EV10 | Neither §5.2 nor §5.8 is in `DATA_SECTIONS` (`contract-fingerprint.ts:37-43`) or `PACKAGE_SECTIONS` (`:27`) | repo file | repo |
| EV11 | The increment directory is untracked but not ignored (`git check-ignore` exit 1, empty output), so it is committable | `git check-ignore -v`, `git status --porcelain` | tool output, this session |

## The chunk's review surface — five clusters

Cluster assignment is disjoint and covers all 189 REQs.

- **A — Extraction and confidence (§5.2, 58 REQs / 37 family rows, all bucket
  E).** The evidence-surface coverage map, conversion-evidence verification,
  vendor and source integrity, extraction categories and structural
  verification, the intended-gap whitelist, and the package-model contract.
- **B — Story journal and campaign memory (§5.8 `REQ-246`, `331`, `333`,
  `310`; 15 REQs / 4 family rows).** Journal capture and surfacing,
  journal-world coupling, journal-to-lore promotion, campaign-memory
  accumulation and retrieval.
- **C — Synthesis engine (§5.8 `REQ-080`, `103`, `130`, `226`–`228`, `230`,
  `231`, `243`–`245`, `260`–`266`; 65 REQs / 18 family rows).** Synthesis
  boundaries and the citation-verification obligation (REQ-080h), activation
  and reversion, the model and confidence model, auto-trigger, the convergence
  cache key and pre-computed manifest, the rebuild contract, briefing and
  dashboard surfacing, per-module toggles, and voice profiles.
- **D — Prompt composition and section tokens (§5.8 `REQ-081`, `082`, `185`,
  `186`; 12 REQs / 4 family rows).** The narrative directive, prompt section
  ordering, section-token vocabulary, and token discoverability.
- **E — Lore, macros, suggestions, and scene contracts (§5.8 `REQ-083`,
  `084`, `085`, `086`, `087`, `114`, `115`, `125`, `155`, `158`, `234`, `328`,
  `589`; 39 REQs / 13 family rows).** Dynamic lore and sticky-counter decay,
  lore-world coupling and secrets, action suggestions and pattern activation,
  macros and audit compression, scene tagging and the scene-transition hook, the
  independent-verification obligation, and the ruling ledger.

## Steps

### Phase 0 — Baseline (planning record only; a C0 source fix is a separate commit)

1. Create `tasks.md` and a provisional `aar.md` (status `in progress`, ending
   `LOOP OPEN`) in the increment directory first. `check-loop-artifacts`
   reports a missing `tasks.md`/`aar.md`, and then an unclosed token, for this
   increment until they exist and close; both findings are self-inflicted
   drafting state (P7a D89) and are never a C0 trigger.
2. Run `npm run check:fast` and `npm run check` un-piped; record exit status
   and the trailing `PASS`/`FAIL` line. A red baseline other than the
   increment-record finding above is a gate defect: fix it as its own commit
   (C0) before any review work, per the standing route.
3. Run `npm --prefix holonovel run test:all`; record the per-harness summary.
   Run the P7b-specific harnesses (`test:narrative`, `test:memory-recall`,
   `test:lean-narrator`, `test:briefing`, `test:selection`,
   `check:conversion-evidence`, `check:vendor`) and record whether each is
   already reached by `test:all`.
4. Record `git status --porcelain`, `git rev-parse --short HEAD`, and
   `origin/main..HEAD`; confirm the cold-pass report is at
   `/tmp/opencode/p7b-cold/` and the evidence sidecar under
   `~/.local/state/opencode/plans/`, both outside the repo.
5. Confirm `git check-ignore -v docs/plans/2026-11-09-full-review-p7b/` returns
   nothing.
6. Record Q1–Q10 as D91–D100 in the sweep worklist.
7. Write the plan-gate preflight evidence sidecar and re-stamp the plan as
   `independence: fresh` with the cold-report path and sha256.
8. Re-derive the 189-REQ / 76-family-row set with `grep -n '^\*\*REQ-'` over
   each section range, and its buckets from `spec/audit/req-coverage.md`; stop
   and re-stamp on a verified mismatch.

### Phase 1 — Code side (read-only review)

1. **Enumerate the surface** with `file:line` anchors: every export of
   `core/wisdom.ts`, `core/prompt-composition.ts`, `core/memory.ts`, and
   `core/macros.ts`; the `manage_synthesis` / `manage_story` / `manage_lore` /
   `manage_scene` action branches; the journal and campaign-memory fields in
   `core/state.ts`; and the §5.2 gate predicates in `scripts/validate.ts`.
2. **Review cluster A** against §5.2: confirm each row is still an intended
   builder-side gap, that its named evidence surface exists in the coverage
   map, and that the conversion-evidence and vendor gates exercise it.
3. **Review cluster B** against §5.8: journal capture scope, the
   `decision`/`bond` filter, surfacing in `badge_briefing` and recap, the
   promotion path, and campaign-memory accumulation, retrieval, and badge
   gating.
4. **Review cluster C** against §5.8: boundary enforcement, citation
   verification, the confidence model and tie-breaking, activation and
   reversion atomicity, cache-key determinism, manifest freshness, and the
   rebuild contract.
5. **Review cluster D** against §5.8: section ordering, the token vocabulary,
   token discoverability, and the narrator harness's actual assertions.
6. **Review cluster E** against §5.8: lore lifecycle and decay, lore-world
   coupling, suggestion coverage and pattern activation, macro expansion and
   audit compression, scene tagging and the transition hook, secrets handling,
   and the ruling ledger.
7. **Open every cited harness** and record exercise, not token presence.
8. **Record** 189 REQ verdicts, the behaviour table, and five cluster verdicts.

### Phase 2 — Spec side (citation resolution)

1. Resolve every `_Check:_` citation for the 189 rows using the
   P2/P3b/P4/P5/P6/P7a method (Q7).
2. Classify citation kind; record `Automated` tokens with no exercising harness
   as findings — the §5.8 synthesis citations are the expected concentration
   (EV7), confirmed or refuted row by row.
3. Fill bucket and verdict columns for all 189 rows.
4. **Coverage register.** When a P0 fix edits a REQ body, or a re-measured
   bucket differs from `spec/audit/req-coverage.md`, run
   `npm run validate -- --write-register` and include the regenerated register
   in the commit. When no body and no bucket changed, record that the register
   is unchanged and needs no regeneration — do not skip the check silently.

### Phase 3 — Triage, registers, roadmap, artefacts

1. **Triage findings P0–P3** per Q2. A P0 fix lands with a targeted assertion;
   if it edits a REQ body, apply Q8's rule (no fingerprint regeneration needed).
2. **`spec/audit/review-register.md`**: one dated heading per used disposition
   section, rows per **Register write-back**.
3. **`ROADMAP.md`**: keep the sweep item's 1–3 bullet + `**Trigger:**` shape and
   update it to chunk P8 and the closing M1 re-run, retaining the scope clause.
   When triage produces scheduled findings, add remediation section(s) of 1–3
   bullets split by theme, every bullet naming its `REQ-NNN` IDs; when triage
   produces none, add no second section.
4. **`CHANGELOG.md`**: one dated heading
   `<YYYY-MM-DD> — Full-review sweep: chunk P7b (extraction and synthesis)`.
   Verify the CalVer date at execution.
5. **Artefacts**: tick `tasks.md`, replace the provisional `aar.md` with the
   execution record and the token the outcome earns, and update the sweep
   worklist's status table (P7b closed-or-halted; P8 next).
6. Run the verification table; commit per the plan's commit order.

## Register write-back

| Disposition | Section | Row shape |
|---|---|---|
| `Resolved` | first `## Resolved` block (`review-register.md:12`), newest-first | `### <date> full-review sweep — chunk P7b`; bullet `**F-P7b-N — <title> (resolved <YYYY-MM-DD>):**` + predicate + the REQ IDs it covers + fix location + the assertion that now covers it (or `no new assertion`) |
| `Scheduled-roadmap` | `## Scheduled-roadmap` | same heading; bullet names the finding, the predicate, the REQ IDs it covers (including lowercase suffixes), and the `ROADMAP.md` section it is scheduled under, plus the date; each cited `REQ-NNN` also appears literally in that `ROADMAP.md` section |
| `Closed-P3` | `## Closed-P3 (recorded, no action)` | same heading; bullet records the predicate, the REQ IDs, the date, and why no action follows |
| `Deferred-by-user` | `## Deferred-by-user` | only on an explicit user deferral; names the decision |

## Stopped-run landing

If a P0 cannot be fixed within the session, the run halts and still lands as a
record:

1. `worklist.md` marks chunk P7b `halted on <finding ID>` and keeps the partial
   tables.
2. `ROADMAP.md` gains a section for the P0: heading
   `## <finding ID> — <title> (P0)`, 1–3 bullets naming the predicate, the
   reproduction, and the finding's `REQ-NNN` IDs, and a `**Trigger:**` line;
   the admission rule and the strict REQ-literal rule both apply.
3. `CHANGELOG.md` heading reads
   `<date> — Full-review sweep: chunk P7b (halted on <finding ID>)`.
4. The unfixed P0 is a `Scheduled-roadmap` row whose matching `ROADMAP.md`
   entry is the P0 section. A baseline P0 is a gate defect and gets no register
   row.
5. `aar.md` ends `LOOP OPEN` naming the P0 row; gates still run.
6. The roadmap scope clause records "chunk P7b halted", never "closed".
7. No push. The P0 is the next session's first item, ahead of chunk P8.

**Deferral-halt branch.** When the session ends with clusters unreviewed and no
P0 open, the run still lands as a record: `worklist.md` marks those clusters
`deferred:P7b-resume` with the completed tables; `ROADMAP.md` keeps the sweep
section and its trigger names chunk P7b resume, then chunk P8; `CHANGELOG.md`
reads `<date> — Full-review sweep: chunk P7b (partial: clusters <X> deferred)`;
`aar.md` ends `LOOP OPEN`, names each unreviewed cluster, and states the resume
point. No push.

**Red-baseline branch.** When the unfixable P0 is the baseline itself: record
the red output verbatim in `aar.md` (`LOOP OPEN`), add
`## Baseline red — <gate> (halted)` to `ROADMAP.md`, write no `CHANGELOG`
entry, stage only the planning record, and commit manually with
`--no-verify` because the pre-commit hook cannot pass on a tree that is red by
construction. The run does not claim green gates.

## Blast radius

- **P0 fix in cluster A** (`scripts/validate.ts`, `holonovel/scripts/
  check-conversion-evidence.ts`, vendor manifest handling): the §5.2 coverage
  map is a spec gate; a change there re-runs `validate` and the vendor gate for
  every build, so the fix carries its own assertion and a re-run of
  `check:fast`.
- **P0 fix in clusters B–E** (`holonovel/src/core/wisdom.ts`,
  `holonovel/src/core/prompt-composition.ts`, `holonovel/src/core/memory.ts`,
  `holonovel/src/core/macros.ts`, the four handlers in
  `holonovel/src/index.ts`, journal and campaign-memory state fields): prompt
  composition is on every turn's path, and journal/memory fields persist with
  the Novel. A fix there re-runs `test:narrative`, `test:memory-recall`,
  `test:lean-narrator`, `test:briefing`, `test:selection`, plus
  `test:persistence` when a persisted field changes.
- **Regeneration surfaces a P0 can force** (conditional, named here so the fix
  cannot fail `check:fast` unrecorded): a handler description or schema change
  regenerates `holonovel/tool-definitions.json` via
  `npx tsx holonovel/scripts/generate-tool-definitions.ts`
  (`check-tool-definitions-sync`); a new or renamed Novel-persisted state
  surface also names it in §7.7 and §5.19, carries its §7.7.0 class contract
  and clone/checkpoint/archive enumerations (REQ-240a/241a/334b), and
  classifies it in `holonovel/DECISIONS.md`; any §7.7/§5.19 edit runs
  `npm run build-order` before the next `check:fast` after that edit, because
  those sections feed the data fingerprint. The Verification table runs
  `build-order` last for the ordinary review-only path; a P0 that touches
  §7.7/§5.19 inverts that order.
- **Version sync (every run).** `npm run build-order` runs the version-bump
  step unconditionally (`scripts/build-order.ts:251-254`). This increment's
  `CHANGELOG.md` heading is dated 2026-11-09, which equals the current CalVer
  (`holonovel/package.json:3`), so the bump is a no-op and rewrites nothing —
  `version-bump.ts:20-24` only advances on a newer changelog date. `build-order`
  still runs for its fingerprint and README-marker steps
  (`holonovel/AGENTS.md` is a version target; README `@spec:` markers come from
  `refresh-properties`). The `**Spec hash:**` line in
  `holonovel/DECISIONS.md` is written by `push-pipeline.sh`'s
  `spec-update-record.ts`, not by this increment and not by the version step.

## Considered and rejected

- **Split §5.2 off as its own increment.** Rejected: its 37 rows are all bucket
  E and its evidence map is already mechanised, so a separate session would
  spend a whole increment on disposition checks that fit inside this one.
- **Defer §5.8's prompt-composition rows to P8.** Rejected: P8 owns §5.12 and
  §5.25–§5.27/§5.32–§5.35; §5.8 is a named sweep surface and splitting a family
  across chunks breaks bucket inheritance.
- **Skip §5.2 as all builder-side.** Rejected: it is a named sweep surface and
  the point of the row is to confirm no row drifted into server-side scope
  without a citation.
- **Re-file §5.14/§5.16–§5.18 package defects found while reading §5.2's
  package-model row.** Rejected: those belong to the closed P6b findings; the
  review cross-references instead.

## Verification

| Check | Command | Expected |
|---|---|---|
| Assembly | `npm run assemble` | exit 0 |
| Fast gate | `npm run check:fast` un-piped | trailing `check:fast: PASS` |
| Full gate | `npm run check` un-piped | trailing `check: PASS` |
| Server suite | `npm --prefix holonovel run test:all` | all harnesses PASS |
| Narrative | `npm --prefix holonovel run test:narrative` | PASS |
| Memory and recall | `npm --prefix holonovel run test:memory-recall` | PASS |
| Lean narrator | `npm --prefix holonovel run test:lean-narrator` | PASS |
| Briefing | `npm --prefix holonovel run test:briefing` | PASS |
| Selection | `npm --prefix holonovel run test:selection` | PASS |
| Conversion evidence | `npm --prefix holonovel run check:conversion-evidence` | PASS (waived or strict-clean) |
| Vendor manifest | `npm --prefix holonovel run check:vendor` | PASS |
| Registers | `npm run check-registers:strict` | PASS |
| Coverage register | `npm run validate -- --write-register` (only when a body or bucket changed) | PASS, register regenerated or unchanged |
| Roadmap | `npm run check-roadmap` | PASS |
| Loop artifacts | `npm run check-loop-artifacts` | PASS |
| Version sync | `npm run build-order` | PASS (version sync) |

## Risks and rollback

- **Risk — §5.8's 131 REQs overwhelm one session.** Mitigation: Q10's halt rule
  lands completed clusters and marks the rest `deferred:P7b-resume`; the AAR
  says so plainly.
- **Risk — citation-mis-attribution findings are filed on token absence alone.**
  Mitigation: the plan's finding evidence rule requires the `file:line` or
  `spec:line` predicate before a finding is filed; a token-only observation
  stays a note until a harness body is read.
- **Risk — reading `manage_synthesis` re-litigates §5.7 determinism.** Mitigation:
  Q5(a); a determinism defect is cross-referenced to its P7a finding.
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

None at runtime unless a P0 fix lands: this increment otherwise records review
verdicts and schedules remediation. A P0 that changes a handler, prompt
composition, or a persisted field does change runtime behaviour; the changelog
and AAR name the affected surface and the turn or persistence path it touches.

## Evidence

Phase 0–3 fill the verified evidence into `tasks.md` and `aar.md`. The counts in
EV1–EV3 are the drafting measurements and are re-derived at Phase 0 step 8
before execution. `tasks.md` and `aar.md` are created at Phase 0 step 1, so
`check-loop-artifacts` reports this increment incomplete between drafting and
execution — the same state P7a recorded (D89).
