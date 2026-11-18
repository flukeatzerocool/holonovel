# Plan — Roadmap drain 11: close REQ evidence linkage by ratifying the residue

**Date:** 2026-11-17 · **Kind:** planned · **Depth:** standard · **Revision:** 3 ·
**Increment:** `docs/plans/2026-11-17-roadmap-drain-11` · **Rollback cost:** 1 ·
**Evidence:** git HEAD `430e2bb`; tracked tree clean at plan time, so the baseline is recoverable
with `git checkout -- <path>`. Baseline readings on this tree: `npm run check:fast` exit 0
(`46 passed, 0 failed`, trailing `check:fast: PASS`); `npm run validate` exit 0 with
`REQ evidence linkage: 47 finding(s)`; `npm run status` — 5 open roadmap items, 146 unpushed
commits, tag `v2026.11.08`, last pipeline run stopped at `record`.
**Trust boundary:** every premise below is `repo` evidence read from this checkout. No web or
user-supplied content is embedded.
**Review history.** Revision 1 was read by one cold pass (five stages, one cold context, 38 reads):
one Blocker, three Majors, seven Nits. The Blocker was an execution contradiction — `T253`
enters `exercisedIds` in P2, so `spec/audit/req-coverage.md` goes stale and `validate` fails
there (`scripts/validate.ts:2210-2218`, `:3120-3121`), while the plan regenerated the register
in P5 and required `validate` green in P3, P4, and V1. The Majors were a wrong register-diff
predicate (`:189` reads `S22`, and the register is family-keyed, so no `REQ-211c` row exists),
an overclaimed `T253` (REQ-211c's "sub-check enumeration" was asserted by no clause), and an
under-specified baseline JSON schema. Revision 2 resolves all eleven: the register is
regenerated in P2 and verified in P5; the diff predicate reads `S22` → `S22, T253`; clause (f)
asserts the sub-check enumeration; D3 carries the literal JSON skeleton and names
`LINKAGE_CLASSES` authoritative over the file's `classes` header; the record's extent is stated
once; the baseline taxonomy is renamed "disposition class"; the count drop is explicitly not
treated as proof of behaviour; the register termination sentence carries a date; two line cites
and the V7/V8 predicates are corrected; and the `--single` opt-out is justified. The diff
re-review confirmed all eleven as RESOLVED and raised one regression and one Nit on the changed
lines, both fixed in revision 3 (a condition-only amendment, not re-reviewed): clause (a) had
dropped the blank-line tolerance and would have failed on the live record, and "the six diff
cases" was not a countable set. Revision 3 restores the tolerance and names the eight cases.

## Questions

The request: "draft plan for open roadmap items." `ROADMAP.md` carries five sections. Four are
trigger-gated or operator-bound (EV2). One — item 3, REQ evidence linkage
(`ROADMAP.md:36-57`) — is the standing work queue chunks 1–9 have drained from 122 to 47. This
plan does not add a tenth chunk to that queue; it performs the close action the item itself
names: **every remaining row dispositioned, class (a) at zero, and the check in error mode in
`validate`**. The 46 rows that cannot be asserted from a committed artifact are ratified as
reviewed baseline entries with a measured disposition each; the 47th is asserted.

## Why

- **EV1 — item 3 states its own close condition, and the residue is now uniform.**
  `ROADMAP.md:56-57`: "**Trigger:** every remaining row dispositioned and class (a) at zero;
  closes when the check is error-mode in `validate`." The corpus
  (`docs/plans/2026-11-15-req-evidence-linkage/corpus.md`, 47 data rows) is every one
  `Automated | automated-unexercised`. The predicate is T-ID-scoped: an `Automated` Appendix F
  row whose ID appears in no exercising site (`scripts/lib/req-checks.ts:886-889`), where
  "exercised" is gathered from `test("…")` titles under `holonovel/scripts/` and from
  `check*`-function labels under `scripts/` (`scripts/validate.ts:1485,1497-1516`,
  `scripts/lib/req-checks.ts:854-870`).
- **EV2 — the other four roadmap items cannot start in this session.**
  - Item 1, independent verification (`ROADMAP.md:15-23`): triggered by "the first publish after
    2026-11-16", and the last pipeline run stopped at `record` with 146 unpushed commits. The
    work binds the operator: §10 requires a cold checkout, a redacted DECISIONS.md (6), and "a
    fresh agent session — a different model from the builder"
    (`spec/07-independent.md:11-18`). Not startable here.
  - Item 2, mutation-sample depth (`ROADMAP.md:25-34`): trigger is "the next Holosuite lens
    change"; this increment adds no lens. Not triggered.
  - Item 4, split `index.ts` (`ROADMAP.md:59-66`): trigger is "the next increment that moves more
    than 50 anchors, or a week with more than 100 reads of one file". This increment moves no
    anchors (V8) and reads `index.ts` zero times. Not triggered.
  - Item 5, codex pack (`ROADMAP.md:68-78`): P3; trigger is "the next artifact-registry change
    (REQ-620/REQ-621), or a request to move a codex library between hosts". Neither applies.
- **EV3 — the residue is one disposition class deep, and the assignment is P1's product.** All 47 rows
  are `automated-unexercised` (EV1). By row text they fall into five families whose asserting
  artifact is not a committed file: a live-MCP drill (the row's procedure calls tools and inspects
  replies), a build-time procedure (a ruleset build or a builder Phase recording into
  `DECISIONS.md` (5)/(6) or `RULESET_MODEL.md`), a Pattern Buffer coverage row (chunk 9 measured
  29 `s_id` scenarios against the 37 sub-workflows §6.6 numbers —
  `docs/plans/2026-11-17-roadmap-drain-9/plan.md:110-116`), an operator obligation (§10
  verification or a measurement run), and one contradiction (**EV4**). The per-row disposition and the
  evidence string are not asserted here: P1 produces them, one command per row (P1), and the
  plan's baseline acceptance (V5) counts entries, not families.
- **EV3a — the harness evidence path exists but is unused for these rows.** `gatherExercisedIds`
  counts a T-ID from a `test("…")` title under `holonovel/scripts/`
  (`scripts/validate.ts:1497-1516`) as well as from root `check*` labels (`:1485`). A residue row
  is therefore closable by naming a harness test that genuinely asserts its clause; P1's stop
  rule tests for exactly this, because a row with a covering test must not be baselined (D3's
  `evidence` cell would be false).
- **EV4 — `T87` contradicts its own REQ and must be reconciled before it can be dispositioned.**
  The row (`spec/appendices-reference.md:1569`) asserts "query latency (mean of 5 representative
  lookups) ≤ 1 second". REQ-100a (`spec/02-requirements.md:2406`) states in the normative body:
  "Query latency is a recorded trend metric and carries no pass/fail threshold." Chunk 9 recorded
  this as the reason the row could not be asserted
  (`docs/plans/2026-11-17-roadmap-drain-9/plan.md:135-138`). A ratified baseline entry for a
  contradiction would freeze a spec defect; the row text is corrected in the same increment
  (D4).
- **EV5 — `T253` is the one residue row that parses a committed artifact today.** REQ-211c
  (`spec/02-requirements.md:1452-1455`) requires an evidence record to be parseable "without
  depending on prose interpretation": workflow identifier, timestamp, environment pins,
  pass/fail status, sub-check enumeration. `holonovel/DECISIONS.md:2509-2518` carries exactly one
  record of that shape — `#### narrative_coherence (G7)`, `@section evidence`, then six dash
  bullets labelled `Workflow`, `Timestamp`, `Environment pins`, `Commands and output`,
  `Pass/fail`, `Findings`. The contract is stated at `spec/05-verification.md:3-6`. No script
  parses these fields: `grep -rn "Environment pins\|Pass/fail" scripts/` returns nothing.
- **EV6 — the repository already runs this exact ratchet shape.** `validate` records two
  nominal-evidence counts in `spec/audit/conformance-baseline.json` and fails when a count rises
  (`scripts/validate.ts:1803-1816`, applied at `:3040-3049`). The pattern — a reviewed JSON
  baseline plus a fail-closed ratchet — is established; this plan applies it per row rather than
  per count, because a count cannot record a disposition.
- **EV7 — a per-row baseline is a reviewed register, not a suppression list.** `AGENTS.md`
  ("Review-loop governance") requires a finding to be suppressed only by "a reviewed exception in
  `spec/audit/script-quality-baseline.json`", and terminal dispositions are
  `Resolved` / `Scheduled-roadmap` / `Closed-P3` / `Deferred-by-user`. The new baseline carries a
  closed disposition-class set and a non-empty `evidence` string per entry; an unclassified entry, an
  empty evidence string, a stale entry, or an entry for a non-`automated-unexercised` verdict is
  an error, so the file cannot silently absorb a new gap.

## Decisions

- **D1 — Scope: assert `T253`, reconcile `T87`, ratify the other 46 rows, flip the check to
  error mode, retire ROADMAP item 3.** The chunk's product is the state change item 3 names, not
  another 3-row slice. Residue after the increment: `0 unbaselined`, `46 baselined`.
  - Rejected: chunk 10 as three more authored assertions. The assertable pool is exhausted: the
    only residue row with a committed artefact to parse is `T253` (EV5); every other row is one
    chunk 9 rejected with a measurement (`T107`/`T431`/`T537`/`T539` — harness shortfall; the
    coupling cluster `T422`/`T426`/`T428`/`T432`/`T433`/`T496` — requires a D&D 5e build and a
    committed coupling table the reference tree does not carry; the bucket-C runtime rows
    `T4`/`T72`/`T73`/`T379`/`T371`/`T489`/`T113`/`T114` — live server). A tenth slice would close
    at most one row and leave the item open on the same terms.
  - Rejected: leave item 3 open and record the ratchet as a new work queue. Item 3's own trigger
    names the close condition; a plan that meets it and does not close the item is a deliberate
    drift from the maintainer's admission rule.
  - Rejected: re-cite the 46 rows to `Manual` in Appendix F. That is a 46-row spec rewrite
    (over the 300-line split limit) and each row would then need a DECISIONS.md procedure — the
    class (c) treatment chunk 6 gave 23 rows, done 46 times in one session.
- **D2 — `T253` home: new `function checkEvidenceRecordContract(decisionsText: string | null):
  string[]` in `scripts/validate.ts`.** It is pure and takes the DECISIONS.md text the linkage
  block already reads (`scripts/validate.ts:2958-2965`), so the file is read once and the parser
  is testable without a fixture file. A `null` text (scratch checkout with no DECISIONS.md)
  returns `[]` for the same reason the Manual rule skips rather than relabels (the committed tree
  always carries the file); that limit is recorded in `dispositions.md`. It asserts:
  - (a) at least one `@section evidence` block exists in DECISIONS.md; the record is the
    contiguous `- ` bullet run that follows the marker — blank lines between the marker and the
    run are skipped, and the run ends at the first non-bullet, non-blank line — and that run is
    scanned for the labels in (b); bullets carrying other labels (today four of them,
    `holonovel/DECISIONS.md:2519-2522`) are ignored, so a seventh labelled bullet cannot satisfy
    a missing required field;
  - (b) the record carries all six required labels as exact bold labels after `- `:
    `**Workflow**`, `**Timestamp**`, `**Environment pins**`, `**Commands and output**`,
    `**Pass/fail**`, `**Findings**`, each with a non-empty value after its em dash;
  - (c) the `Workflow` value begins with a canonical workflow token — `G0a`, `G0b`, `G2`–`G8`,
    or `H1`–`H18` (REQ-211a's enumeration);
  - (d) the `Timestamp` value matches `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})`;
  - (e) the `Pass/fail` value is `pass` or `fail` (case-insensitive);
  - (f) the record carries a **sub-check enumeration**: at least one bullet after the six of the
    form `- **(<lowercase letter>) <name>** — <non-empty result>` (today `(a)`/`(b)`/`(c)` at
    `holonovel/DECISIONS.md:2519-2521`), so REQ-211c's "sub-check enumeration" clause is
    asserted rather than assumed.
  Every failure message carries `T253` and names the block and the missing or malformed field. A
  missing marker is a `T253` failure, not a silent empty set.
  - Not claimed, recorded in `dispositions.md`: `T253`'s per-workflow extension clauses (G0
    records enumerate Appendix H/D items individually; G2 adds per-contract coverage; G4 adds
    per-test counts; G5 adds per-sub-workflow verdicts with blocking classification) have no
    record in the tree to parse — the sole record is G7. The T-ID is claimed by clauses (a)–(f);
    the per-workflow extensions are named as unclaimed, the shape chunk 8 used for `T298`
    (`docs/plans/2026-11-17-roadmap-drain-9/plan.md:121-125`).
  - Existing-check discovery (recorded): `grep -rn "Environment pins\|Pass/fail\|@section evidence"
    scripts/` returns nothing. The adjacent check is `holonovel/scripts/generate-g7-attestation.ts`
    (`npm run check-g7-attestation`), which regenerates and compares the `g7:start`/`g7:end`
    disposition table and the attested-parent rows — not the record's field contract. No overlap.
  - Rejected: a standalone `check-evidence-record.ts` gate — two file reads and one parse do not
    justify a manifest row plus a `check-script-discipline` surface.
- **D3 — Baseline mechanism: a pure diff in `scripts/lib/req-checks.ts`, wired in `validate`.**
  New exported `diffLinkageBaseline(findings, entries)` returns
  `{ unbaselined: LinkageFinding[]; stale: string[]; invalid: string[] }`:
  - key is `` `${finding.reqId}|${finding.tid}` ``;
  - a baseline entry suppresses a finding **only** when the finding's verdict is
    `automated-unexercised`; any other verdict (`no-row`, `manual-undocumented`, `unknown-kind`)
    is reported as unbaselined even when a matching entry exists;
  - `stale` carries entries with no matching finding; `invalid` carries entries whose `class` is
    outside the closed set, whose `evidence` is empty, or whose key is duplicated.
  `validate` then: loads `spec/audit/evidence-linkage-baseline.json`; prints one
  `WARNING: REQ-EVIDENCE …` line per unbaselined finding; prints
  `REQ evidence linkage: N baselined, M unbaselined finding(s)`; and adds every unbaselined
  finding, every stale key, and every invalid entry to `errors`. The existing
  `warnings += linkage.length` line (`scripts/validate.ts:2985`) is replaced, not added to.
  - The closed **disposition-class** set (declared as `LINKAGE_CLASSES` in `req-checks.ts`;
    the words "class (a)/(b)" elsewhere in this plan are ROADMAP's chunk classes, a different
    taxonomy): `server-drill` (a live-MCP drill only a harness can assert), `build-time` (a
    ruleset build or builder Phase obligation), `pattern-buffer-gap` (needs sub-workflow coverage
    the harness does not reach), `operator` (§10 verification or an operator measurement),
    `spec-conflict` (the row contradicts its REQ; only a spec reconciliation clears it — unused
    after D4).
  - The file is `spec/audit/evidence-linkage-baseline.json`, with this literal shape (one entry
    shown; 46 in the increment):
    ```json
    {
      "schema_version": 1,
      "purpose": "Reviewed dispositions for REQ evidence-linkage rows that no committed artifact can assert.",
      "classes": ["server-drill", "build-time", "pattern-buffer-gap", "operator", "spec-conflict"],
      "entries": [
        { "req": "REQ-011c", "tid": "T182", "class": "build-time", "evidence": "…" }
      ]
    }
    ```
    Entry fields are `req`/`tid`/`class`/`evidence`, sorted by `(req, tid)`; `req` mirrors
    `LinkageFinding.reqId` and `tid` mirrors `LinkageFinding.tid`. `LINKAGE_CLASSES` in
    `req-checks.ts` is authoritative: a `classes` array that differs from it, or an entry
    `class` outside it, is an `invalid` error (drift fails loud rather than silently narrowing
    the set).
  - `--write-linkage-baseline` regenerates the file deterministically: entries sorted by
    `req` then `tid`; existing `class`/`evidence` preserved for a key still present; a new key
    emitted as `class: "unclassified"`, `evidence: ""`; a dropped key reported on stdout. The
    gate fails on `unclassified`/empty, so a regeneration cannot be committed without a
    human-authored disposition; the regeneration run itself exits 1 for exactly that reason, and
    the acceptance reading is the file's bytes plus a following classified run (V9).
  - A missing baseline file fails closed: every finding is unbaselined, so the gate errors
    rather than silently passing an empty set.
  - A baselined row whose Appendix F kind flips `Automated` → `Manual` makes its entry `stale`
    and errors the gate. That is intended: correcting a row's kind must delete its baseline
    entry in the same edit, and the error names the key.
  - Rejected: extending `conformance-baseline.json` (counts only, no room for a disposition).
    Rejected: a count ratchet (`linkageFindings: 47`). It meets the letter of "no new gaps" but
    not the roadmap's "every remaining row dispositioned" — a count cannot name a class.
  - Rejected: keying on `tid` alone. `T431` is cited by two REQs and `T87` by two; a T-keyed
    baseline would let a newly citing REQ ride an existing waiver.
- **D4 — `T87` reconciliation: delete the latency-threshold sentence from the Appendix F row.**
  `spec/appendices-reference.md:1569` loses "Assert query latency (mean of 5 representative
  lookups) ≤ 1 second." The cold-start tier clause stays (REQ-100b,
  `spec/02-requirements.md:2408-2409`, states the tier thresholds), and the recording clauses
  stay. No REQ body changes, so no fingerprint surface moves and `assemble` re-derives only the
  Appendix F line and the phase-map hash (V6). The row is then baselined as `operator`, not
  `spec-conflict`: its remaining obligations are a measurement run and a DECISIONS.md (4) record.
  - Rejected: authoring `T87` by labelling `check-performance-record.ts`. That gate
    (`spec/audit/performance-record.json`, T686) verifies that the record declares its terms; it
    does not verify the tier threshold (the record carries no `tier` field) or the five lookup
    categories. Labelling it `T87` would be a copied ID for a clause it does not assert.
  - Rejected: leaving the row untouched and baselining the contradiction. A ratified
    contradiction is a frozen spec defect, not a disposition.
- **D5 — `T188` (H12 cold-checkout G2 replay) is baselined as `operator`.** It requires an
  evidence entry produced by a cold-checkout replay — the same dependency as ROADMAP item 1. Its
  entry's evidence names `spec/06-artifacts.md:57` and the absent record. It is not merged into
  D4 or D2: the row's four fields (`command`, `exit_code`, `g2_result`, `env_pins`) do not exist
  anywhere in DECISIONS.md (EV5's grep), so there is nothing to parse.
- **D6 — the corpus and its flag are retired; the baseline replaces them.**
  `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` is deleted and
  `--write-linkage-corpus` is removed from `scripts/validate.ts`; `AGENTS.md:418-421` documents
  the replacement flag. The baseline file is the per-row record from here on. Historical
  references to the corpus path in `docs/plans/2026-11-15-*/` and in dated review-register prose
  stay as dated records; the new review-register entry names the retirement.
  - Rejected: keeping the corpus as a generated empty table — a generated artifact that is empty
    by construction invites "no findings, nothing to do" misreading.
- **D7 — register coupling (hard-check §2).** One step updates every cross-referencing surface.
  `ROADMAP.md` item 3 is **retired** (the admission rule removes a shipped section,
  `ROADMAP.md:3-13`). `spec/audit/review-register.md` changes twice in the same step: the
  `### 2026-11-15 REQ evidence linkage (P1)` subsection under `## Scheduled-roadmap`
  (`:3088-3121`) is closed with a termination line pointing at this increment, and a new
  `## Resolved — 2026-11-17 REQ evidence linkage closed` section is appended at the file end
  (`:3850` is the current last section, so the append matches the register's dated-entry
  convention) recording the retirement, the 46 ratified rows, the `T253` closure, the `T87`
  correction, and the corpus retirement. `spec/audit/req-coverage.md` is regenerated **in P2**,
  immediately after `T253` enters `exercisedIds`, because the freshness check is an error
  (`scripts/validate.ts:2210-2218`, counted into `errors` at `:3120-3121`) and the `REQ-211`
  row's *Exercised tests* cell gains `T253` (today `S22` at `spec/audit/req-coverage.md:189`;
  the register is family-keyed, so no `REQ-211c` row exists). P5 verifies freshness; it does not
  write the register. `spec/audit/evidence-linkage-baseline.json` is the new tracked register.
  `CHANGELOG.md` is rendered from the AAR block by `session:close`.
  - The register carries no spec-hash line today (`renderCoverageRegister` writes one only when
    the assembled spec contains "Spec hash:", `scripts/validate.ts:2185-2186`; `grep -c "Spec
    hash" holonovel.md` reads `0`), so P3's `assemble` does not re-stale it.
  - The termination line under `## Scheduled-roadmap` is **prose carrying a date, not a
    `- **…**` bullet**: `check-registers:strict` (full mode) parses every bullet under that
    section and errors when it cites a `REQ-NNN` absent from ROADMAP.md
    (`scripts/lib/register-checks.ts:60-72`), and the date satisfies the general date rule
    (`:61`). The new Resolved bullets likewise cite a date.
- **D8 — no new gate row; the check is error-mode inside `validate`.** `validate` is already in
  `check:fast` and `check`, so the flip changes no manifest and no CI workflow. `check-gate-table`
  and `check-workflows` stay untouched.
- **D9 — probes are negative and restored.** Each new behaviour is proven by a failure, then the
  artifact is restored and `git status --porcelain -- <path>` confirmed empty (the increment
  directory stays untracked until `session:close`).
  - `T253` probe: delete `- **Timestamp** — …` from the G7 record; `validate` must print the
    `T253` failure; restore.
  - Unbaselined probe: delete one baseline entry; `validate` must print the unbaselined finding
    and exit 1; restore.
  - Stale probe: add a bogus `REQ-999|T999` entry; `validate` must report it stale; restore.
  - Invalid probe: set one entry's `class` to `unclassified`; `validate` must report it invalid;
    restore.
  - `no-row` probe: add `T999` to one REQ's `_Check:_` line in `spec/02-requirements.md`;
    `assemble`; `validate` must report `no-row` and exit 1 (a verdict the baseline cannot
    suppress, per D3); `git checkout -- spec/02-requirements.md`; `assemble` again;
    `git diff --stat holonovel.md` empty for that round-trip.

## Blast radius

| File | Change | Size |
|---|---|---|
| `scripts/lib/req-checks.ts` | `LINKAGE_CLASSES` const, `LinkageBaselineEntry` type, `diffLinkageBaseline` | M |
| `scripts/validate.ts` | new `checkEvidenceRecordContract(decisionsText: string \| null): string[]` (T253) + call beside the linkage block; linkage wiring: baseline load, `diffLinkageBaseline`, error counting, `--write-linkage-baseline`, `--write-linkage-corpus` removal | M |
| `scripts/test-req-checks.ts` | self-tests for `diffLinkageBaseline` and the T253 record parser | M |
| `spec/audit/evidence-linkage-baseline.json` | new: 46 entries + disposition-class header | M |
| `spec/appendices-reference.md` | T87 row: delete the latency-threshold sentence | S |
| `holonovel.md` | regenerated by `assemble` (T87 row) | S |
| `holonovel/holonovel.md` | regenerated by `assemble`; **untracked** package copy, not committed (`check-spec-copy` is full-only) | S |
| `spec/build-phase-map.md` | regenerated spec-content hash (`assemble`) | S |
| `holonovel/src/generated/g7-attestation.ts` | regenerated `SPEC_HASH` after the T87 row edit moved the assembled-spec hash (delta amendment, P5) | S |
| `ROADMAP.md` | item 3 retired | S |
| `spec/audit/review-register.md` | close subsection | S |
| `spec/audit/req-coverage.md` | regenerated (REQ-211 evidence cell) | S |
| `AGENTS.md` | `--write-linkage-corpus` → `--write-linkage-baseline` (line 420) | S |
| `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` | deleted | S |
| `docs/plans/2026-11-17-roadmap-drain-11/plan.md` | this plan | S |
| `docs/plans/2026-11-17-roadmap-drain-11/tasks.md` | P1 checkpoint list | S |
| `docs/plans/2026-11-17-roadmap-drain-11/dispositions.md` | 47 rows + unclaimed clauses | M |
| `docs/plans/2026-11-17-roadmap-drain-11/aar.md` | written in P5 | S |
| `CHANGELOG.md` | rendered from the AAR block by `session:close` | S |

Rollback: every change is a tracked edit or a new tracked file; `git checkout -- .` plus
`git clean -fd docs/plans/2026-11-17-roadmap-drain-11` returns the tree to `430e2bb`. The
Appendix F edit is one line, reversed by `git checkout`. Ordering: P2 and P4 both edit
`scripts/validate.ts` and run in sequence; P3 touches only `spec/appendices-reference.md` and
`assemble` output and must precede P4 (the baseline is authored against the reconciled row set).
P5 consumes all of them.

## Phases

- **P1 — Dry run (the error-gate dry run), dispositions, and the baseline classification.**
  Accept:
  `npm run validate` reproduces `REQ evidence linkage: 47 finding(s)` and `0 error(s)`;
  `grep -c '^| REQ-' docs/plans/2026-11-15-req-evidence-linkage/corpus.md` reads `47`;
  `grep -n "@section evidence" holonovel/DECISIONS.md` returns exactly one line (`:2511`);
  the six labels are present at `:2513-2518` and satisfy D2's clauses by inspection. Write
  `tasks.md` (one line per phase, ticked as it lands — `session:close` requires it,
  `scripts/lib/loop-artifacts.ts:72-74`) and `dispositions.md` with one row per finding
  (`| REQ | T-ID | disposition class | evidence | action |`). Every `evidence` cell is produced by a command
  in this phase: for each row, the distinctive term from its Appendix F row text is grepped over
  `scripts/` and `holonovel/scripts/`, and the cell records the harness or the absence
  (`grep -rn '<term>' scripts/ holonovel/scripts/ → …`). The disposition-class distribution is re-derived,
  not echoed. **Stop rule:** if any row's grep shows a harness test that already asserts the row's
  clause under a different T-ID, record it as `author` (a title addition closes the row) and stop
  to amend this plan before writing the baseline — do not silently baseline a row whose evidence
  exists. No source write before this stop rule clears.
- **P2 — `T253`.** Accept: `checkEvidenceRecordContract` reports nothing on the unmodified tree
  and is reachable from `main()` — reachability and the D9 probe are the proof of behaviour, not
  the finding-count drop (the predicate harvests the ID from the function's own message literals,
  `scripts/lib/req-checks.ts:864-868`, so a self-test alone would also satisfy it; N3 of the cold
  report); `npm run validate -- --write-register` reports `REQ evidence linkage: 46 finding(s)`
  and writes `spec/audit/req-coverage.md`; a following plain `npm run validate` exits 0 with
  `PASS: Coverage register is current` and a register diff of `S22` → `S22, T253` on the
  `REQ-211` row (P1 reads the pre-edit row, so the expectation is measured, not assumed); the
  `T253` label appears in the probe's failure message. Probe per D9 (the missing-`Timestamp`
  case).
- **P3 — `T87` reconciliation.** Accept: the row text at
  `spec/appendices-reference.md:1569` carries no latency threshold; `npm run assemble` succeeds;
  `git diff --stat` shows `holonovel.md` and `spec/build-phase-map.md` only; `npm run validate`
  stays at `0 error(s)` and `46 finding(s)`.
- **P4 — Baseline and error mode.** Accept: `spec/audit/evidence-linkage-baseline.json` holds 46
  entries, sorted, each with a disposition class from D3's set and a non-empty evidence string;
  `--write-linkage-baseline` twice produces identical bytes (`git diff --stat` empty on the
  second run); `validate` prints `REQ evidence linkage: 46 baselined, 0 unbaselined finding(s)`
  and exits 0; the five D9 probes each fail with their stated message and restore. Self-tests
  (`npm run test:validators`) cover these eight diff cases — suppression only on
  `automated-unexercised`; a `no-row`/`manual-undocumented`/`unknown-kind` verdict unsuppressible
  even with a matching key; a stale key; an entry `class` outside `LINKAGE_CLASSES`; an empty
  `evidence`; a duplicate key; a `classes` header that differs from `LINKAGE_CLASSES`; a missing
  baseline file — plus the T253 parser's missing label, non-empty-failure sub-check enumeration,
  malformed timestamp, unknown workflow token, and non-`pass`/`fail` value.
- **P5 — Registers, artifact, gates.** Accept: `ROADMAP.md` carries four `## ` sections (item 3
  gone) and `npm run check-roadmap` passes; the review-register close subsection exists and
  `npm run check-registers` passes; `npm run validate` prints `PASS: Coverage register is current`
  (the register was written in P2, not here); `AGENTS.md:420` documents the new flag; the corpus
  file is deleted. Then, in this order: write `aar.md` with the plan's readings **and its terminal
  token already filled** (an `aar.md` without `LOOP PAUSED`/`LOOP OPEN` fails
  `check-loop-artifacts`, `scripts/lib/loop-artifacts.ts:79-84`, which would redden V3) → run
  V1–V9 and record every reading → **finalise `aar.md`** (probe evidence, changelog block,
  terminal token confirmed) → run V3 last, un-piped → `session:close`.
  - The close uses `--single` because AGENTS.md's concern split exists to separate *independent*
    concerns, and the `T87` row correction is a prerequisite of this increment's single product
    (D4): the row cannot enter the baseline as an honest disposition while it contradicts
    REQ-100a. Splitting it would produce a commit that adds a baseline entry the next commit
    rewrites — two states, one concern.

## Verification

| # | Command | Expected |
|---|---|---|
| V1 | `npm run validate` | exit 0; `0 error(s)`; `PASS: Coverage register is current`; `REQ evidence linkage: 46 baselined, 0 unbaselined finding(s)` |
| V2 | probes per D9 (five) | five labelled failures, each restored (`git status --porcelain -- <path>` empty; `git diff --stat holonovel.md` empty after the restoring `assemble`) |
| V3 | `npm run check:fast` (un-piped, run last in P5) | `46 passed, 0 failed` … `check:fast: PASS` |
| V4 | `npm run test:validators` | `N passed, 0 failed` with the new diff and T253 cases counted |
| V5 | `node -e` on the baseline: entry count, key uniqueness, disposition-class membership, non-empty evidence | `46`; no duplicate; every class in D3's set; no empty evidence |
| V6 | `npm run assemble`; `git diff --stat` | `holonovel.md` (T87 line) and `spec/build-phase-map.md` (content hash) only; no other spec source changes |
| V7 | `npm run check-anchors`; `npm run check-roadmap`; `npm run check-registers`; `npm run check-traceability` | pass |
| V8 | `npm run check-anchors` (anchor delta predicate); `git diff --stat holonovel/src` | pass with no anchor drift; no server source change (item 4 stays untriggered) |
| V9 | `npm run validate -- --write-linkage-baseline` then `git diff --stat spec/audit/evidence-linkage-baseline.json` | empty (deterministic regeneration) |

## Done bar

**Done bar:** `T253` carries a real asserting site with a recorded negative probe; `T87` no
longer contradicts REQ-100a; `spec/audit/evidence-linkage-baseline.json` holds 46 reviewed
per-row dispositions; `validate` is error-mode on the linkage check with `0 unbaselined`; ROADMAP
item 3 is retired and the four remaining items are unchanged; the registers agree; `check:fast`
is green; `aar.md` ends `LOOP PAUSED`; `npm run session:close --single` commits the increment.

## Out of scope

Authoring assertions for any of the 46 baselined rows; the Pattern Buffer coverage shortfall
(`T537`/`T539`/`T107`/`T431`) and the coupling cluster; the T686 performance record gaining a
`tier` field; ROADMAP items 1, 2, 4, 5; any publication step; any `holonovel/src` change.

## Open questions

- None blocking. The cold pass resolved both of revision 1's open questions: the `T87` row edit
  stands as part of this increment (D4, now justified in P5), and the review-register placement
  is confirmed (`## Scheduled-roadmap` at `spec/audit/review-register.md:3086`, last `## ` section
  at `:3850`). P1's stop rule remains the one execution-time branch: a residue row whose grep
  finds a covering harness test leaves the baseline and becomes an `author` row, and the plan is
  amended before any baseline entry is written.

## Delta amendment — 2026-11-17, during P2

**What changed.** The coverage-register diff reads `S22` → `T253, S22`, not `S22, T253` as P2's
acceptance and P5 predict. `renderCoverageRegister` emits `exercisedTests.join(", ")`
(`scripts/validate.ts:2193`) in the order the row collects them — Appendix F citations first,
then the §6.6 sub-workflow map — so a `T` ID precedes an `S` ID.

**Why.** The prediction was written from the cell's existing content rather than from the
renderer's ordering rule. The measurement is authoritative; the plan's expected-diff text is
corrected here rather than silently mismatched.

**Scope.** Text-only expectation correction in this plan. No file-list change, no new gate, no
destructive step. P2's substantive acceptance (46 findings, register current after the write,
`T253` in the `REQ-211` cell) is unchanged.

## Delta amendment — 2026-11-17, during P5

**What changed.** `holonovel/src/generated/g7-attestation.ts` is a blast-radius addition: the
T87 Appendix F edit moves the assembled-spec hash, and the G7 generator embeds it as `SPEC_HASH`
(its header says it is regenerated "when §5.12 or the coverage register moves").
`check-g7-attestation` reddened on the stale constant; the sanctioned regeneration
(`npx tsx holonovel/scripts/generate-g7-attestation.ts`) changed exactly one line — the hash.

**Why.** The artifact is generated, committed, and freshness-gated; the plan's blast radius
omitted it because the dependency runs through the assembled-spec hash, not through a §5.12
edit. Leaving it stale would red `check:fast`; editing it by hand is forbidden by its header.

**Scope.** One generated constant in one file, produced by its own generator. V8's "no server
source change" predicate is restated: no behavioural server source changed; the only
`holonovel/src` delta is a generated hash constant.
