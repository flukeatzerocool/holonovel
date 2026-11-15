# Plan — U3: runtime conventions and the engine contract remainder (chunk 3 of 8)

Status: draft v8 (self pass 4 defects; supplementary read 1 Blocker + 4 Majors;
cold Stages 1–2: 3 Majors + 7 Nits; Stage 3: 3 FAIL/Major clusters + 1 Blocker;
Stage 4: 5 Majors + 8 Nits; Stage 5: 3 Majors, 2 Nits, 1 resolved Unknown;
Stage 5 re-audit: 1 Major, 2 Nits — all fixed; five-stage cold pass complete) ·
Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-14-unscoped-u3/`
Rollback cost: 1 (one revert: `plan.md`, `tasks.md`, `review.md`, `aar.md`,
`plan.cold/`, the register rows, the `worklist.md` status and boundary lines,
the roadmap trigger line, the bounded prose fix set,
`contract-fingerprints.ts` **only if** §7.7 is corrected, `holonovel.md` +
`holonovel/holonovel.md`, `CHANGELOG.md`)
Evidence class: repo (EV1, EV2, EV7, EV13, and EV16 are `tool-output`; every
other premise is a `file:line` read at HEAD `bc86264`)
Trust boundary: every premise is read from the working tree at HEAD `bc86264`;
no web, user, or fetched content enters the plan.
Review independence: **fresh** — five-stage cold pass recorded in
`plan.cold/`; the canonical artifact is `plan.cold/report.md`, whose hash the
stamp records.

## Resolutions (cold Stage 5 re-audit, v7 → v8)

- **R11 [Major] — the full-only gate enumeration missed `test:pipeline`.** Step
  19 and T19 now name `check-container-image`, `playability`, and
  `test:pipeline`, with a discriminator: environment failure → Unknown; a
  failure on an untouched surface → a pre-existing baseline failure fixed as its
  own commit; a failure caused by a fix hunk → P0 in-session.
- **R12 [Nits] — the batch had no heading and the tally mis-stated R10.** This
  section is the heading; the status line now reads "3 Majors, 2 Nits, 1
  resolved Unknown".

## Resolutions (cold Stage 5 readiness, v6 → v7)

- **R6 [Stage 5] — the `DATA_SECTIONS` anchor was stale.** The constant is at
  `scripts/lib/contract-fingerprint.ts:37-43` (the `"### 7.7 "` entry at `:42`),
  not `:27-40`; every citation is repointed.
- **R7 [Stage 5] — the full-mode gate inventory was incomplete.** Step 19 now
  also covers `playability` (full-only, never exercised by the `check:fast`
  baseline) under the same rule: an environment failure is an Unknown, a real
  failure is a P0 fixed in-session.
- **R8 [Stage 5] — C-1's "intentional bound" branch had no evidence path.**
  `holonovel/DECISIONS.md:1861` records the P1–P54 → P1–P59 expansion, so the
  range is a maintained live count; C-1 is now decidable as a defect unless
  DECISIONS records a deliberate P60/P61 exclusion, which it does not.
- **R9 [Stage 5 Nits] — `engine.ts` is 19 lines, not 21; `review.md` is an extra
  increment artifact.** Both corrected; the U1 and U2 increments already carry
  `review.md` beside plan/tasks/AAR, so `check-loop-artifacts` is known to
  tolerate it.
- **R10 [Stage 5 Unknown resolved] — `check-registers --strict` exists.**
  `scripts/check-registers.ts:9-10,22-28` documents the flag and its exit
  contract, so done-bar 6's command is valid.

## Resolutions (cold Stage 4, v5 → v6)

- **R1 [Major] — the independence field was one stage stale.** It now reads
  "stages 1–4 complete, 5 pending".
- **R2 [Major] — the rollback enumeration kept `cold-review.md`.** It now names
  `plan.cold/`, `tasks.md`, and `aar.md`.
- **R3 [Major] — D3's one-line-predicate exception contradicted three
  sections.** The exception is deleted: every demonstrated code defect is P1,
  and Open question 2 asks about a P1 code defect, not a P0 one.
- **R4 [Major] — the done bar demanded a "next chunk" datum no step wrote.**
  Step 16 now also records the next chunk.
- **R5 [Major] — the version row named `holonovel/src/index.ts` while the
  read-only row claimed all of `holonovel/src/**`.** The read-only row now
  carves out the two conditionally written files.
- **Nits.** P2 states one range (`:1049-1206`); EV9's config anchor is `:1273`;
  Q3 attributes the 14 §7 rows to the 754-line span, not all 28; the `world`
  merge predicate is credited to the inventory row, not D1; `tasks.md` T6 uses
  the post-S12 wording; the staged guard is labelled a negative confirmation;
  D5 quotes the worklist with `worklist.md:167`; the `check-container-image`
  note is keyed to the branch where a full-mode run occurs.

## Resolutions (cold Stage 3, v4 → v5)

Three critics ran in parallel; style and structural returned FAIL, design PASS
with Majors. Consolidated below.

- **P1 [Blocker, style; Major, structural] — the independence field
  contradicted the status line.** The field now reads "stages 1–2 complete, 3–5
  pending" and names `plan.cold/report.md` as the canonical cold artifact;
  `cold-review.md` is removed from the blast radius (S3-6).
- **P2 [Major, style; Major, design] — the predicate symbol was wrong.**
  `checkCouplingDerivation` does not exist. The function is
  `checkCouplingCompleteness` (`scripts/validate.ts:1049-1206`); every citation
  now uses that name and that range. The config check starts at `:1273`, not
  `:1269`.
- **P3 [Major, style] — "3 Majors + 10 Nits" over-counted.** The Stages 1–2
  ledger records 3 Majors and 7 Nits; the status line now says so.
- **P4 [Major, style] — a third Resolutions section interrupted the phases.**
  All Resolutions sections now sit above `## Questions`; the phase list is
  unbroken.
- **P5 [Major, style] — a residual "five surfaces" survived.** Open questions
  now say seven line sites across four files.
- **P6 [Major, style] — "six gate consumers" was unenumerable.** Step 2 now
  names them: `action-conflicts`, `check-tool-surface`, `surface-budget`,
  `surface-replay`, `tool-citation-check`, `check:conformance`.
- **P7 [Major, style] — `P<n>` meant three things.** The sweep phases are now
  written "sweep phase 1–8"; "worklist/D6" disambiguates the split procedure.
- **P8 [Major, design] — C-13's skip-path citation was wrong.** The validator
  has no vocabulary test on pattern-rule tuples at all: `:1184-1188` errors on
  an unresolvable *coupling-row* token, and the only `VALID_ARCHETYPES` check is
  the §7.7 table's warning at `:1090`. C-13 is now stated as a **manual**
  vocabulary comparison with no existing predicate, not as a skip.
- **P9 [Major, design] — the P0/P1 rubric could classify one finding twice.**
  Step 12 now ties the class to the fix surface: a prose defect is P0; a
  demonstrated code defect is P1 and scheduled.
- **P10 [Major, design] — `builder-side` quietly relaxed the exit evidence.**
  Step 16's worklist note now records the vocabulary interpretation alongside
  the boundary amendment: §7.3a's builder duty is not a runtime check, so its
  row exits `builder-side` rather than claiming code-or-gate coverage.
- **P11 [Major, design] — Appendix T's REQ cells were unexamined.** Settled:
  no base `REQ-369`/`REQ-370` block exists (only `a`/`b`), the T rows cite the
  family, and `validate:sdd` is clean at HEAD — so those cells are family
  references, not dead IDs, and are outside the atomic set. Only the range text
  in those rows is edited.
- **P12 [Major, structural] — the staged gate was vacuous.** Step 19 now stages
  the fix set (`git add` the edited paths) before `npm run
  check-guarded-rule-change`; otherwise the pre-commit hook is the enforcement
  point and the manual run is dropped.
- **P13 [Major, structural] — P2 had no terminal disposition.** `D3` now
  restates the house rule: a P2 that is not bounded is downgraded to P3
  (record-and-close), so every class terminates.
- **P14 [Major, structural] — the baseline and re-check used different
  commands.** Step 13 now runs `npm run assemble && npm run validate:sdd` — the
  same proofreading pass as EV16 — and records that this is the only full-mode
  proofreading run when `build-order` is skipped.
- **P15 [Major, structural] — the done bar omitted the boundary amendment.**
  Done-bar item 5 now carries the `worklist.md:167-168` amendment.
- **P16 [Major, structural] — the cold artifact had two paths.** One canonical
  path (`plan.cold/report.md`); `plan.cold/` holds stage reports.
- **P17 [Nits] — the `world` merge predicate, `756` vs `754`, Q2's stale `:152-167`,
  `tasks.md` ownership, the version-row condition, the missing mapping-table
  column for boundaries, the branch-dependent "confirmation" annotation, and
  the pre-declared split fence.** Each is fixed in place: the surface-inventory
  row states the `world/index.ts`+`model.ts` merge predicate; Q2 and EV4 read
  `:152-168`; Q3 records the §7 span as 754 of the file's 756 lines and
  pre-declares the fence (split at the prose/code boundary per worklist/D6) if
  Phase 2 exceeds one session; step 16 owns `tasks.md` checkbox updates; the
  version row reads "date differs **and** `build-order` runs"; boundaries move
  to prose in `review.md`; `check-fingerprint-sync` is "a confirmation when
  `build-order` ran, the only check when it did not".

## Resolutions (cold Stages 1–2, v3 → v4)

- **S5 [Major, Stage 1] — the achievability arithmetic was wrong both ways.**
  v3 measured 329 contract lines (the whole file) and 2,315 code lines (the
  `world/*` subtree only). The chunk owes ~134 contract lines (§1 plus §7–§10
  and the appendix) and ~3,607 named-code lines; Q3 now states both, excluding
  the `index.ts` body.
- **S6 [Major, Stage 1] — the flagship fix named the wrong REQ bodies.**
  `spec/02-requirements.md:3811` sits in **REQ-369a** and `:3816` in
  **REQ-370a**; no unsuffixed REQ-369/REQ-370 block exists. C-1, the blast
  radius, and step 14 now name the suffixed bodies.
- **S7 [Major, Stage 1] — C-13's §7.7 edit path was unaccounted.** C-13 can edit
  §7.7.0 (`:499`), which is fingerprint-bearing. The blast radius now keys
  `build-order` to "C-1 or C-13", and step 14 records any §7.7 edit.
- **S8 [Nit, Stage 1] — D1's split rule implied 29 rows.** D1 now states the four
  §7.7 rows and why §7.7.1/§7.7.1a share one (one predicate).
- **S9 [Nit, Stage 1] — EV16's line numbers were unqualified.** They are the
  assembled `holonovel.md` lines; EV16 now says so.
- **S10 [Nit, Stage 1] — EV4's range excluded `:168`.** It now reads `:152-168`,
  which is the sentence D5 relies on.
- **S11 [Nit, Stage 1] — `build-order`'s full `check` is conditional.** The
  enforcement table now states the change set that triggers it.
- **S12 [Nit, Stage 1] — "minus the four" read as 7.** Step 6 now says "the 10
  remaining `###` headings".
- **S13 [Nit, Stage 2] — the finding-ID namespace was undefined.** D2 defines
  `F-U3-<n>` in row order.
- **S14 [Nit, Stage 2] — three reader gaps.** Step 19 and done bar 6 name
  `check-guarded-rule-change`; done bar 1 fixes the `review.md` table shapes and
  the unique-numbered-table condition; Q3 cites the worklist `D6` split
  procedure instead of an undefined `D-split`.

## Resolutions (supplementary cold read v2 → v3)

The read was single-context, not five stages, so it is recorded here as a
finding source only — it is not independence evidence.

- **CR-1 [Blocker, clarity] — the artifact's identity claim was false.** v2
  asserted `Review independence: fresh` while no cold artifact existed, and its
  declared hash was stale after later edits. The field now reads **pending**, and
  the hash is re-derived after the last edit before any gate reads it.
- **CR-2 [Major, clarity] — the row accounting summed to 32.** The budget table
  is 14 + 6 + 8 = 28, but Phase 2 step 6 assigned 14 §7 rows and step 8 added 4
  more §7.7 rows. Step 6 now reads **10 rows** (§7.1–§7.9 minus the four §7.7
  rows) and step 8 reads **4 of the 14**, so the steps and the done bar agree.
- **CR-3 [Major, design] — the §7.7.0 predicate tested the wrong table.** Step 8
  tested the property table's archetype column; the pattern-rule table is what
  needs the check, and P60's `Surface` target (`spec/04-runtime.md:499`) is not
  in `VALID_ARCHETYPES` (`scripts/validate.ts:1051`) or its aliases — so a
  literal step-8 run returns `holds` on a vacuous predicate. Step 8 now tests
  the **pattern-rule** Source/Target columns, and C-13 records the `Surface`
  token for an explicit disposition.
- **CR-4 [Major, design] — the fix crossed the chunk boundary unstated.**
  `worklist.md:167-168` says "review-only chunks change no body"; C-1's fix
  edits REQ bodies. The boundary is now reconciled in D5 and named in step 16:
  the increment is not review-only because a P0 prose defect is fixed, and the
  worklist note is amended to say so.
- **CR-5 [Major, clarity] — "five places" was seven `file:line` sites across
  four files.** D3's scope sentence did not cover the §4/§5/Appendix surfaces
  the fix touches. D3 now names them, and step 14 enumerates the seven sites
  verbatim: `spec/04-runtime.md:648`, `spec/01a-constitution.md:116`,
  `spec/02-requirements.md:3811,3816`, `spec/appendices-reference.md:1880,1881,1894`.
- **CR-6 [Nit] — the last two gates are not a dependency chain.** `build-order`
  runs the full `check`, which already contains `check-fingerprint-sync`; the
  trailing run is a confirmation. Done-bar item 6 now says so.
- **CR-7 [Nit] — the version rows are date-sensitive, not "moot".**
  `build-order` steps 5 and 5b run unconditionally; they are no-ops only while
  the CalVer date equals the session date. The blast-radius row now states the
  condition.
- **CR-8 [Nit] — `aar.md` carried "gate results" before the gates ran.** Step 18
  now says the gate block is a placeholder until step 20.
- **CR-9 [Nit] — the body-line count excluded the wrapper.** `index.ts` is
  18,833 lines including the dispatch wrapper; the body is ~18,826.

## Resolutions (self pass v1 → v2)

- **S1 — the prose baseline was asserted, not measured.** v1 promised "§7
  readability warnings must not increase" with no number. EV16 now records the
  `npm run validate:sdd` baseline at this HEAD, and step 13 cites it.
- **S2 — a §7 edit can trip the two §7 predicates late.** v1 checked only at
  `check:fast` (step 20), after the AAR and the register writes. Step 13 now
  runs `npm run assemble && npm run validate` immediately after the prose
  corrections, so a coupling- or annotation-shape break surfaces before
  bookkeeping.
- **S3 — the blast radius omitted its read-only set.** v1 named
  `scripts/validate.ts`, `gate-manifest.ts`, `contract-fingerprint.ts`,
  `assemble.ts`, `engine.ts`, `library.ts`, and `package.json` in the phases but
  listed them only under "Not touched". The table now carries a read-only row,
  so `build-review` can distinguish a read from a change.
- **S4 — the commit shape was unstated.** Step 20 now records that
  `session:close` owns the split: one commit when a `spec/` edit is present, a
  by-concern split when every candidate holds and the increment is docs-only.

## Questions

1. **Which roadmap item is next?** `ROADMAP.md:15-32` — the Unscoped-surface
   review sweep (P2). Its `**Trigger:**` (`:30-32`) names the next allocated
   review session as **U3, runtime conventions and the engine-contract
   remainder**; U2 closed on 2026-11-14 and advanced the trigger
   (`docs/plans/2026-11-10-unscoped-surface-review/worklist.md:92`). The three
   other open items are later: harness test-ID hygiene, anchor repoint
   automation, and the loop-gate re-measurement dated 2026-11-28.
2. **What does U3 owe?** `worklist.md:152-168` defines the chunk: prose
   `spec/04-runtime.md` §7 (11 subsections) and `docs/engine-contract.md` §1,
   §7–§10 plus the clause-to-source appendix; code `holonovel/src/core/server.ts`,
   `rulesets.ts`, `tool-registry.ts`, `surface-report.ts`,
   `core/surface-projection.ts`, `world/*`, and the `index.ts` dispatch wrapper;
   lens `drift-report` plus `code-review`; exit evidence is *each §7 subsection
   maps to code or a gate, every engine-contract clause in the appendix resolves
   to a live `file:line`, and the §7.7 property groups match the coupling
   tables*.
3. **Is the chunk session-achievable?** Measured below: the 14 §7 rows cover the
   §7 span (754 of the file's 756 lines), the 6 contract rows cover ~134 lines
   (§1 at `:24-33` plus §7–§10 and the appendix at `:206-329`; §2–§6 are not
   re-read), and the 8 code rows cover ~3,607 lines — the five small modules plus
   `world/*`, excluding `index.ts`'s ~18,826-line body, which is reviewed only at
   its dispatch wrapper. The two machine-checked §7 blocks carry a named predicate; most of
   §7 is contract prose. The bar is one session. The split fence is
   **pre-declared**: if Phase 2 cannot finish, split at the prose/code boundary
   (U3a = §7 + the engine contract, U3b = the code rows) and record it in
   `worklist.md` under its `D6` procedure — never use a split as a done-bar
   escape hatch.
4. **What counts as a finding here?** Two classes, because the chunk's lens is
   two-lens: (a) *drift* — §7 or the engine contract claims a mechanical
   guarantee, names a file or symbol, or states a count that the predicate does
   not deliver; (b) *code* — a named module does not implement the contract its
   header, §7, or the engine contract states. Prose that addresses the builder
   with no repository check is `builder-side`, not a gap (`D1`).

## Baseline at HEAD (this session)

| # | Evidence | Command / source | Trust |
|---|---|---|---|
| EV1 | Tree clean on `main`, HEAD `bc86264`, 92 unpushed commits, version `2026.11.14`, 4 open roadmap items | `git status --porcelain`; `npm run status` | tool-output |
| EV2 | Fast gate green: 41 passed, 0 failed, `check:fast: PASS` | `npm run check:fast` (un-piped) | tool-output |
| EV3 | The roadmap item and its trigger | `ROADMAP.md:15-32` | repo |
| EV4 | Chunk U3 prose, code, lens, gates, exit evidence, and boundary (`:152-168`, including the "review-only chunks change no body" sentence at `:167-168`) | `docs/plans/2026-11-10-unscoped-surface-review/worklist.md:152-168` | repo |
| EV5 | §7 carries **11** `###` headings in 756 lines: 7.1 `:3`, 7.1a `:24`, 7.2 `:36`, 7.3 `:43`, 7.3a `:75`, 7.4 `:106`, 7.5 `:118`, 7.6 `:127`, 7.7 `:243`, 7.8 `:685`, 7.9 `:696`; §7.7 contains two `####` blocks (`7.7.0` `:324`, `7.7.1` `:502`) and two `#####` blocks (`7.7.1a` `:527`, `7.7.1b` `:640`) | `grep -n '^### ' spec/04-runtime.md`; `wc -l` | repo |
| EV6 | The engine contract is 329 lines: §1 `:24`, §2 `:34`, §3 `:73`, §4 `:95`, §5 `:137`, §6 `:163`, §7 `:206`, §8 `:255`, §9 `:274`, §10 `:287`, appendix `:313`; the appendix carries **13** rows | `grep -n '^## ' docs/engine-contract.md`; `sed -n '313,329p'` | repo |
| EV7 | Named code sizes: `core/server.ts` 77, `rulesets.ts` 753, `tool-registry.ts` 98, `surface-report.ts` 197, `core/surface-projection.ts` 167, `world/index.ts` 24, `world/model.ts` 1222, `world/parser.ts` 1069, `index.ts` 18833 | `wc -l` (a single `tool-output` command) | tool-output |
| EV8 | The §7.7 state model is **fingerprint-bearing**: `DATA_SECTIONS` includes `"### 7.7 "` (`scripts/lib/contract-fingerprint.ts:37-43`), and the constant is regenerated by `build-order` | `scripts/lib/contract-fingerprint.ts:4-6,37-43` | repo |
| EV9 | §7 is gated by two predicates: `checkCouplingCompleteness` (`scripts/validate.ts:1049-1206`) and `checkConfigCouplingAnnotations` (`:1273-1330`); the archetype vocabulary is a hardcoded set (`:1051`) | `grep -n` on `scripts/validate.ts` | repo |
| EV10 | The six named gates run in both modes (`scripts/lib/gate-manifest.ts:177-265`) | gate manifest | repo |
| EV11 | `docs/engine-contract.md` is **not** assembled: `assemble` writes `holonovel.md` from `CORE_FILES` + appendices only (`scripts/assemble.ts:48-60`) | `scripts/assemble.ts:48-60`; `scripts/lib/contract-fingerprint.ts:37-43` | repo |
| EV12 | §7.7.0 carries **61** pattern-rule rows (P1–P61); §7.6 cites P60 and P61; a coupling row at `:632` cites P61; §7.7.1b still states "P1–P59" (`:648`), as do `spec/01a-constitution.md:116`, `spec/02-requirements.md:3811,3816`, and Appendix T rows at `spec/appendices-reference.md:1880,1881,1894` — **seven line locations across four files**. The predicate searched `spec/` and `docs/` only; `holonovel/DECISIONS.md:1861` also carries the phrase as historical narrative and is deliberately **excluded** from the fix set | `grep -c '^\| P[0-9]' spec/04-runtime.md`; `grep -rn 'P1–P59' spec docs`; `rg 'P1.P59'` over the repo | repo |
| EV13 | §7.6 declares **101** distinct `TTRPG_*` variables; `holonovel/src/**` reads **97**; four names appear only in the spec: `TTRPG_CONFIDENCE_FLOOR`, `TTRPG_PORT`, `TTRPG_RULESET`, `TTRPG_WORLD_PROMINENCE` | `comm -23` over `grep -o 'TTRPG_[A-Z_]*'` | tool-output |
| EV14 | The engine contract's §9 closures resolve in code: `future_fields` (`core/state.ts`), `withForbiddenAudit` (`core/server.ts`, `core/index.ts`, `index.ts`), the three emitted Novel fields (`core/state.ts`, `index.ts`); the library split is real: `engine.ts:14` sets `HOLONOVEL_NO_AUTOSTART` inside `createEngine()` before the dynamic import, and `index.ts:18828` starts the transport only when the guard is unset | `grep -rl`; `sed -n '1,25p' holonovel/src/engine.ts` | repo |
| EV15 | The 2026-11-09 sweep already reviewed the engine contract §2–§6 (worklist `D2`), so those blocks are `already-reviewed:P5` and are not re-read | `docs/plans/2026-11-10-unscoped-surface-review/worklist.md:20-25` | repo |
| EV16 | Validation baseline: **0 errors, 296 warnings**. §7's own warning sites are condition-stacking, not sentence length: §7.1 `:7381`, §7.7.0 `:7708,7744`, §7.9 `:8069,8105` (each "sentence with 4–5 conjunctions, 0 conditionals") — these line numbers are the **assembled `holonovel.md`** lines the validator reports, not `spec/04-runtime.md` offsets | `npm run validate:sdd` (un-piped, exit 0) | tool-output |

## Surface inventory (the row budget)

One row per unit, as `D1` defines the unit. The row count is the done bar's
countable form.

| Surface | Anchor | Rows |
|---|---|---|
| §7.1 Anchors | `spec/04-runtime.md:3-23` | 1 |
| §7.1a Slugs | `:24-35` | 1 |
| §7.2 Entity IDs | `:36-42` | 1 |
| §7.3 Output contracts | `:43-74` | 1 |
| §7.3a Narrative Freshness (builder-level, `:103`) | `:75-105` | 1 |
| §7.4 Tool-surface conventions | `:106-117` | 1 |
| §7.5 Decisions and workflows | `:118-126` | 1 |
| §7.6 Configuration surface (101 variables, one gated annotation rule) | `:127-242` | 1 |
| §7.7 State tiers and the Novel property-group table | `:243-323` | 1 |
| §7.7.0 Holodeck archetypes and the pattern-rule table (P1–P61) | `:324-501` | 1 |
| §7.7.1 / §7.7.1a coupling derivation and the active-coupling table | `:502-639` | 1 |
| §7.7.1b Coupling curation | `:640-684` | 1 |
| §7.8 Guidance and badge knowledge | `:685-695` | 1 |
| §7.9 Derived-surface algorithms (7.9a–7.9e) | `:696-756` | 1 |
| engine contract §1 Vocabulary | `docs/engine-contract.md:24-33` | 1 |
| engine contract §7 Adapter boundary | `:206-254` | 1 |
| engine contract §8 What E3 must preserve | `:255-273` | 1 |
| engine contract §9 Divergence status | `:274-286` | 1 |
| engine contract §10 Artifact provenance | `:287-312` | 1 |
| engine contract appendix (13 clause rows) | `:313-329` | 1 |
| `core/server.ts` (badge gating, error prefixing, snapshot helpers) | `holonovel/src/core/server.ts` | 1 |
| `rulesets.ts` (package scan/hydrate/validate) | `holonovel/src/rulesets.ts` | 1 |
| `tool-registry.ts` (definition site, dispatch metadata) | `holonovel/src/tool-registry.ts` | 1 |
| `surface-report.ts` (§7.4/§7.9 surface reporting) | `holonovel/src/surface-report.ts` | 1 |
| `core/surface-projection.ts` (profile projection) | `holonovel/src/core/surface-projection.ts` | 1 |
| `world/index.ts` + `world/model.ts` (spatial state, §5.9 seam; one row because `index.ts` is a 24-line re-export and the two share the spatial-state contract) | `holonovel/src/world/index.ts`, `holonovel/src/world/model.ts` | 1 |
| `world/parser.ts` (parser command navigation, §5.10 seam) | `holonovel/src/world/parser.ts` | 1 |
| `index.ts` dispatch wrapper (the `HOLONOVEL_NO_AUTOSTART` seam and tool dispatch, not the 18.8k-line body) | `holonovel/src/index.ts:18827-18833` | 1 |
| **Total** | | **28** |

The boundary is the worklist's: `index.ts` is reviewed **at its dispatch
wrapper** because that is what the engine contract and §7.4/§7.5 name; the
~18,826-line body (of 18,833 total, EV7) is §5's surface (swept in sweep
phase 1–8) and is not re-reviewed.

## Enforcement surface to map against

Read once in Phase 1; each row cites the predicate it resolved to, not a gate's
message (`AGENTS.md` "Finding evidence").

| Consumer | Anchor | Severity today | Contract |
|---|---|---|---|
| `checkCouplingCompleteness` | `scripts/validate.ts:1049-1206` | **error** on an orphaned pattern rule (`:1170`), **warning** on an undefined rule citation (`:1173`) | every pattern rule has ≥1 coupling row; a row's rule matches the row's archetypes |
| `checkConfigCouplingAnnotations` | `scripts/validate.ts:1273-1330` | **error** | a §7.6 `Behavioral` row names a `couples per P<n>` rule that a §7.7.1a row cites, with the Session-source rule requirement (Standing Rule 11) |
| §7.7 archetype vocabulary | `scripts/validate.ts:1051` | **warning** only (`:1090`, property table) | the 12 archetypes plus `[content source]`; pattern-rule tuples are **not** tested against it |
| `action-conflicts --check` | `scripts/lib/gate-manifest.ts:262-265`; `scripts/action-conflicts.ts:12-15,30` | **error** | no action-contract conflict outside the baseline |
| `check-tool-surface` | `scripts/lib/gate-manifest.ts:177-181` | **error** | tool surface counts match the documented surface |
| `surface-budget` | `scripts/lib/gate-manifest.ts:183-186` | **error** | surface inside the declared budget |
| `surface-replay` | `scripts/lib/gate-manifest.ts:189-192` | **error** | recorded surface replays still resolve |
| `tool-citation-check` | `scripts/lib/gate-manifest.ts:207-210` | **error** | tool citations resolve to spec identifiers |
| `check:conformance` | `scripts/lib/gate-manifest.ts:256-259` | **error** | spec-to-code bundle dependence |
| `check-fingerprint-sync` | `scripts/lib/gate-manifest.ts:159-162`; `scripts/lib/contract-fingerprint.ts:37-43` | **error** | `contract-fingerprints.ts` matches the assembled spec (`§7.7` included) |
| `build-order` (build tool) | `scripts/build-order.ts:220-229` | exit 1 | assemble → full `check` when `spec/`, `scripts/`, server source, or `.githooks` changed (so it needs `aar.md`) → propagate → typecheck → version sync |
| `assemble` (build tool) | `scripts/assemble.ts:48-60` | exit 1 on a bad roster | regenerates `holonovel.md` and the `holonovel/holonovel.md` mirror from `CORE_FILES` + appendices — **not** `docs/engine-contract.md` (EV11) |

`holonovel/scripts/**` harness correctness is U4/U6's surface; `scripts/publish/*`
and `push-pipeline.sh` are U5's. They are read only where a §7 row cites them.

## Pre-review candidates

Each candidate is checked against its predicate in Phase 2. A candidate that
does not survive becomes `holds` with the predicate cited; it is not a finding
and is not restated in the register.

| ID | Claim to test | Probe |
|---|---|---|
| C-1 | **Flagship.** §7.7.1b bounds completeness at "P1–P59" (`:648`) and three other files repeat it (`spec/01a-constitution.md:116`; REQ-369a at `spec/02-requirements.md:3810-3811` and REQ-370a at `:3815-3816`; Appendix T at `spec/appendices-reference.md:1880,1881,1894` — seven sites total), while §7.7.0 carries P1–P61 and §7.6 rows cite P60/P61 (EV12). If P60/P61 are normative rules the parser counts, the stated range is a defect in seven places | `grep -c '^\| P[0-9]' spec/04-runtime.md`; read `validate.ts:1136-1175` for whether the validator hardcodes a range or iterates parsed rows |
| C-2 | §7.6 declares 101 variables; `holonovel/src/**` reads 97 (EV13). The four spec-only names must each be build-time, read outside `src`, or a gap | `comm -23` over the two sorted name lists; grep the build tree (`holonovel/scripts`, `scripts/`) for each of the four |
| C-3 | §7.3a is labelled builder-level (`:103`) yet states a documentation duty ("Builders SHALL document … in DECISIONS.md"); `holonovel/DECISIONS.md` must carry the four clauses | `grep -n` in `holonovel/DECISIONS.md` for narrative-output, voice-profile, scene anchoring, and anti-slop entries |
| C-4 | §7.4 says deletion tools use `remove_` and "never `delete_`"; the registered tool names must comply | `grep -rho '"[a-z_]*delete_[a-z_]*"' holonovel/src` (expected: zero hits) |
| C-5 | §7.5 fixes the decision queue shape: ≤25 options, `cancel` always last, `respond_decision` drains exactly one | read the decision-queue emitter in `holonovel/src/index.ts` (grep `NEED_INPUT`, `cancel`) |
| C-6 | §7.8 names three guidance URIs (`guidance://player`, `guidance://game_master`, `guidance://shared`) plus `guidance://<badge>/<anchor>`; they must be registered resources | `grep -rn 'guidance://' holonovel/src` |
| C-7 | §7.9d's hash construction (state/payload/audit, log order, HMAC input order) must match the implementation | read the hash helpers in `holonovel/src/core/` (grep `payload_hash`, `audit_hash`, `createHmac`) |
| C-8 | engine-contract §9's six closures must each resolve (EV14 covers four); `novelToJSON` must re-emit `future_fields` and the three fields | `grep -rn 'future_fields\|novelToJSON\|novelFromJSON' holonovel/src/core/state.ts` |
| C-9 | engine-contract §7 calls `createEngine()` lazy and side-effect-free; `library.ts` statically re-exports it from `engine.ts`, whose import is documented side-effect-free (EV14) | read `holonovel/src/library.ts` (5 lines of code) against the §7 paragraph |
| C-10 | engine-contract appendix row "Adapter and library entries" cites `holonovel/package.json` exports and `holonovel/src/library.ts`; the exports map must carry `.`, `./server`, `./core`, `./world` | read `holonovel/package.json:34-52` |
| C-11 | Each appendix clause row must resolve to a live REQ or file (13 rows, EV6); a dead REQ citation is a finding | resolve every REQ in `:313-329` against `spec/02-requirements.md` (grep each ID) |
| C-12 | §7.7.1a's property tokens must resolve to §7.7 groups or an alias (`T421` claims this is asserted); the predicate must actually exist or the claim is drift | read `validate.ts:1180-1204` and the property-token resolver it calls |
| C-13 | **`Surface` is out of vocabulary.** P60's row is `Session → Surface` (`spec/04-runtime.md:499`); `VALID_ARCHETYPES` holds twelve names (`scripts/validate.ts:1051`) and the alias map (`:1054-1068`) has no `Surface`. No predicate tests a pattern rule's Source/Target tokens at all — the only vocabulary check is the §7.7 table's **warning** at `:1090` — so P60's match can never fire and nothing reports it. Either the archetype set is incomplete or the P60 target token is wrong. This is a **manual** comparison, not a gate the plan can cite | grep `Surface` in `spec/04-runtime.md` and `scripts/validate.ts`; compare every Source/Target token in the §7.7.0 table against the vocabulary |

## Objective

Close chunk U3 with an evidence-backed verdict for every unit of its declared
surface, so the question "do the runtime conventions and the engine contract the
spec states correspond to the adapter and server code that actually runs?" is
answered once, durably, in the register's disposition vocabulary.

## Done bar

**Done bar:** 28 verdict rows with a cited predicate, every finding terminally
dispositioned, zero unfixed P0, the program record advanced, and the gates green
— the numbered list below is the authoritative form.

1. `review.md` in this directory holds **28 verdict rows** (counted by
   `grep -cE '^\| [0-9]+ \|' review.md`; the verdict table is the file's only
   numbered table, so the predicate cannot over-count) — the "Surface
   inventory" table is the budget — each row carrying surface, anchor, a verdict
   (`holds` / `finding:<ID>` / `builder-side` / `already-reviewed:P5`), and the
   predicate or declaration that settles it (`file:line`). The verdict table's
   columns are `# | Surface | Anchor | Verdict | Predicate`; the mapping table's
   are `Consumer | Anchor | Severity | Contract` and its first column is text.
2. Every non-`holds`, non-`builder-side`, non-`already-reviewed` row carries a
   finding ID, and every finding ID has a terminal disposition in
   `spec/audit/review-register.md`: `Resolved`, `Scheduled-roadmap` (with a
   matching `ROADMAP.md` section), `Closed-P3`, or `Deferred-by-user`.
3. All thirteen pre-review candidates are resolved to `holds` or a finding; none
   is left "unverified".
4. Zero P0 findings remain unfixed. Each P1 is on `ROADMAP.md` in
   admission-rule shape (1–3 bullets plus one `**Trigger:**`); `check-roadmap`
   passes. If Phase 3 shows more P0s than the bounded fix set in `D3` allows,
   stop and amend the plan rather than escalating the prose rewrite silently.
5. `worklist.md:93` records U3 as reviewed with its exit evidence, the
   `index.ts` boundary note, the `builder-side` vocabulary note, and the next
   chunk; `worklist.md:167-168` records the boundary amendment when C-1 lands as
   a defect; the `ROADMAP.md` trigger (`:30-32`) names U4.
6. The gates pass un-piped, each with its exit code captured, **after** `aar.md`
   exists (because `build-order` runs the full `check`, and `check` includes
   `check-loop-artifacts`), in dependency order: `npm run assemble` (only if a
   `spec/` file changed) → `npm run check-registers -- --strict` → `npm run
   check-roadmap` → **`npm run build-order` when §7.7 or a §5 body was edited**
   (`D4`) → `npm run check-fingerprint-sync` (a confirmation when `build-order`
   ran; the only fingerprint check when it did not) → `git add` the edited paths
   then `npm run check-guarded-rule-change` on that index. Then `aar.md` is
   amended with the measured results (loop step 7c), `npm run check:fast` prints
   `check:fast: PASS`, and `npm run session:close` commits.
7. `aar.md` records the row count, the finding count by severity, the class
   assigned to any delta the fix set produces, and the gate results. No push.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-14-unscoped-u3/{plan,tasks,review,aar}.md` | the increment record; `tasks.md` is the execution checklist whose checkboxes are updated as steps close; `review.md` is the 28-row verdict table (increment-local artifact) | L (new content) |
| `docs/plans/2026-11-14-unscoped-u3/plan.cold/` | the cold-pass artifacts: `00-scope.md`, per-stage reports, and the canonical `report.md` that the stamp binds | S |
| `spec/audit/review-register.md` | one dated `### 2026-11-14 U3 runtime conventions` heading **per disposition section that receives rows** — a row under a bare `##` heading inherits the preceding `###` block (`scripts/lib/register-checks.ts:25-35,64-67`) | S–M |
| `docs/plans/2026-11-10-unscoped-surface-review/worklist.md` | status line `:93` gains exit evidence, closure, the `index.ts` boundary note, and the `builder-side` interpretation; `:167-168` records the boundary amendment when C-1 lands | S |
| `ROADMAP.md` | trigger line `:30-32` names U4; a new section only if a P1 finding schedules work | S |
| `spec/04-runtime.md` | bounded P0 prose corrections (`D3`); §7.7 only if C-1 or C-13 lands there (**fingerprint-bearing**, `D4`) | S |
| `spec/02-requirements.md` | **conditional and atomic with §7.7.1b** — the P-rule range in the REQ-369a and REQ-370a bodies (C-1); a §5 body edit requires `assemble` + `build-order` | S |
| `spec/01a-constitution.md` | **conditional** — the §4 terminology row repeats the same range (`:116`) | S |
| `spec/appendices-reference.md` | **conditional** — T420/T421/T434 restate the range (`:1880-1881,1894`) | S |
| `docs/engine-contract.md` | **conditional** — P0 corrections in §1/§7–§10; not assembled (EV11), so no fingerprint or `assemble` effect | S |
| `holonovel/src/generated/contract-fingerprints.ts` | **conditional** — only if §7.7 is corrected; regenerated by `build-order`, never hand-edited | S |
| `spec/audit/proofread-register.md` | **conditional** — only if a readability warning is accepted rather than fixed | S |
| `holonovel.md` | regenerated by `npm run assemble` if a `spec/` file changed | S |
| `holonovel/holonovel.md` | the reference-implementation mirror `assemble` also writes (`scripts/assemble.ts:19,154-156`) | S |
| version fields (`package.json`, `holonovel/package.json`, `holonovel/src/index.ts`, `server.json`, `AGENTS.md`, `holonovel/DECISIONS.md`, lockfile) and README `@spec:` markers | **conditional on the session date AND on `build-order` running** — steps 5 and 5b (`version-bump`, `refresh-properties`) run whenever `build-order` runs; they are byte no-ops only while the CalVer date equals the session date (`2026.11.14` today). A skipped `build-order` moves neither (`scripts/build-order.ts:251-258`) | S |
| `CHANGELOG.md` | dated entry, `2026-11-14` | S |
| read-only (not modified) | `scripts/validate.ts`, `scripts/lib/gate-manifest.ts`, `scripts/lib/contract-fingerprint.ts`, `scripts/assemble.ts`, `scripts/build-order.ts`, `holonovel/src/engine.ts`, `holonovel/src/library.ts`, `holonovel/package.json`, and every `holonovel/src/**` module **except** the conditional fingerprint file and `holonovel/src/index.ts` (written only by `version-bump` inside `build-order`) | — |

Not touched: `holonovel/src/**` outside the conditional fingerprint file (a
demonstrated code defect is scheduled, not fixed, per `D3`), `scripts/**`,
`.githooks/**`, `spec/audit/req-coverage.md`, `holonovel/scripts/**`.

## Phases and tasks

### Phase 1 — Build the mapping, then read

1. Read the two §7 predicates once — `checkCouplingCompleteness`
   (`scripts/validate.ts:1049-1206`) and `checkConfigCouplingAnnotations`
   (`:1273-1330`) — and record what each tests, its severity, and the
   archetype set at `:1051`. Stop once severity is settled (EV9).
2. Read the six gate consumers in the enforcement table far enough to record
   their contract — `action-conflicts`, `check-tool-surface`, `surface-budget`,
   `surface-replay`, `tool-citation-check`, `check:conformance`
   (`scripts/lib/gate-manifest.ts:177-265`); do not read the harnesses they
   invoke — that is U4's surface.
3. Read `scripts/lib/contract-fingerprint.ts:37-43` and
   `scripts/assemble.ts:48-60` to confirm which §7 blocks are fingerprint- or
   assembly-bearing (`D4`, EV8, EV11).
4. Read `holonovel/src/engine.ts` in full (19 lines), `library.ts`, and
   `package.json:34-52` to settle C-9 and C-10 before the code rows.
5. Create `review.md`: header, a mapping table (`Consumer | Anchor | Severity |
   Contract`), and the 28 numbered verdict rows (`# | Surface | Anchor | Verdict |
   Predicate`) — the verdict table is the file's only numbered table; the
   mapping table carries anchors only and `plan.md` owns the contract text.

### Phase 2 — Write the verdicts

6. The 10 `###` headings in §7.1–§7.9, **excluding §7.7**, whose four
   sub-block rows step 8 owns: for each heading record whether it states a
   repository-checkable guarantee. A block that instructs the builder (7.3a's
   prompt conventions) is `builder-side` unless it names a repository check or
   tool; a block that names a count, file, symbol, or gate is a finding when the
   predicate does not deliver it.
7. Apply C-1 through C-6 to the §7 rows; record each resolved predicate in the
   row rather than restating the candidate.
8. §7.7 rows (**4 of the 14**, the split step 6 does not cover): the property
   table's archetype column must equal the set at `validate.ts:1051` plus
   `[content source]`; the **pattern-rule** table's Source/Target tokens must be
   compared **manually** against that same vocabulary plus `[content source]`
   (C-13 — `Surface` in P60 is out of vocabulary and no predicate tests it); the
   pattern-rule set must match the coupling derivation's parse (C-1); the
   coupling table's property tokens must resolve through the existing resolver
   (C-12). The property table's own vocabulary check is a **warning** (`:1090`),
   so a green gate does not settle this row.
9. Engine-contract rows (6): §2–§6 are not rows — the contract's §1 is a
   vocabulary row, and the sweep already closed §2–§6 (`already-reviewed:P5`,
   `D6`). Resolve the appendix's 13 clause rows (C-11) and apply C-8/C-9/C-10.
   The appendix row may read `holds` **only** when its predicate lists all 13
   resolutions; a partial list is a finding, not a `holds`.
10. Code rows (8): review each named module against the §7 or contract clause it
    implements — `server.ts` (badge gating and audit seam), `rulesets.ts`
    (§7.6 ruleset variables, §7.5 package refusal), `tool-registry.ts` (§7.4
    naming and annotations), `surface-report.ts` + `surface-projection.ts`
    (§7.4 profiles, §7.9 derived surfaces), `world/*` (§7.7 spatial/parser
    properties), `index.ts` dispatch wrapper (§7.5 decision queue, the
    `HOLONOVEL_NO_AUTOSTART` seam). A module that implements its clause is
    `holds`; a module that does not is a finding with the line pair.
11. Resolve C-7 (integrity hashes) inside the §7.9 row; C-5 (decision queue)
    inside the `index.ts` row. Record the two module boundaries the worklist
    names — `index.ts` body = §5 surface, `world/*` §5.9/§5.10 seam — as prose
    below the mapping table, not as verdict rows (they are not consumer-contract
    pairs).

### Phase 3 — Triage and fix (`D3`)

12. Rank findings P0–P3 exactly as `AGENTS.md` "Review-loop governance" defines
    them, **by fix surface**: a demonstrated wrong statement in prose is P0 and
    fixed in-session; a demonstrated code defect is P1 and scheduled (code edits
    are outside this increment). P1 also covers a normative rule whose check is
    genuinely missing. P2 needs a demonstrated failure and must be bounded —
    an unbounded P2 is downgraded to P3, so every finding terminates. P3 =
    record-and-close.
13. Apply the P0 corrections. Constraints: no simultaneous edit of Appendix M
    and `scripts/lib/req-checks.ts` / `scripts/validate.ts` (that is the
    self-attesting co-change `check-guarded-rule-change` blocks without a
    register entry — if a fix needs both, schedule the check as P1 instead);
    re-read each edited paragraph against the **reference-prose** bar
    (`validate.ts:639-654` — grade 18, no sentence over 45 words, no stacked
    conditions), which governs §7. Baseline: 0 errors, 296 warnings, with five
    §7 condition-stacking sites (EV16); the count must not increase. After the
    last §7 hunk, run `npm run assemble && npm run validate:sdd` — the **same**
    proofreading pass as the baseline — and confirm both §7 predicates
    (`:1049-1206`, `:1273-1330`) stay green. A coupling- or annotation-shape
    break must surface here, not at `check:fast` in step 20. When `build-order`
    is skipped (no §7.7/§5 edit), this is the increment's only full-mode
    proofreading run; record that in the AAR.
14. **C-1 is atomic.** If the P-rule range is a defect, correct all **seven**
    line sites in one step — `spec/04-runtime.md:648`,
    `spec/01a-constitution.md:116`, the REQ-369a body
    (`spec/02-requirements.md:3811`) and the REQ-370a body (`:3816`),
    `spec/appendices-reference.md:1880`, `:1881`, `:1894` — or correct none. A
    prose-only fix leaves the normative bodies stating a false range. Record
    **any** §7.7 edit (C-1's `:648` or C-13's `:499`) for `build-order` at step
    19; do not run it here.
15. Write the register entries with one dated `### 2026-11-14 U3 runtime
    conventions` heading per disposition section that receives rows; each row
    cites the predicate (`file:line`) that settles it. Scheduled rows get their
    `ROADMAP.md` section in the same step (`check-registers --strict` couples
    them).

### Phase 4 — Bookkeeping, AAR, gates, close

The loop's order (`docs/plans/README.md:43-50`) puts the AAR (7b) before the
close (7d), and `build-order` runs the full `check`, which includes
`check-loop-artifacts` — that gate reads `aar.md`. Steps 18–19 are therefore
AAR-then-gates, and step 20 amends the AAR with the measured results.

16. Update `worklist.md:93` with U3's exit evidence, the `index.ts` boundary
    note, the `builder-side` interpretation (§7.3a's builder duty is not a
    runtime check), and the next chunk (U4); amend the chunk's boundary sentence
    (`worklist.md:167-168`) to record that this increment is not review-only — a
    P0 prose defect is fixed in it (`D5`); update the `tasks.md` checkboxes for
    completed steps; edit the `ROADMAP.md` trigger to name U4.
17. Write the `CHANGELOG.md` entry dated `2026-11-14`.
18. Write `aar.md` (row count, findings by severity, dispositions, delta class)
    ending `LOOP PAUSED`; the gate-results block is a **placeholder** until step
    20 fills it (loop step 7c). If the AAR earns `LOOP OPEN`, disposition the
    named item first and re-run — the close refuses `LOOP OPEN`.
19. Run the gates un-piped, capturing each exit code, **now that `aar.md`
    exists**, in dependency order: `npm run assemble` (only if a `spec/` file
    changed) → `npm run check-registers -- --strict` → `npm run check-roadmap` →
    `npm run build-order` **conditionally** (`D4`) → `npm run
    check-fingerprint-sync` → `git add` the edited paths, then `npm run
    check-guarded-rule-change` against that index. That guard is a **negative
    confirmation** here: it fires only on an Appendix M + validator co-change,
    which this increment avoids, so a pass records the absence of that
    co-change. If `build-order` ran and a full-only gate (`check-container-image`,
    `playability`, or `test:pipeline`) could not run in this environment, record
    it as an environment Unknown in the AAR. A full-only gate that **ran and
    failed** is discriminated by whether the failure touches this increment's
    surface: a failure on an untouched surface is a pre-existing baseline
    failure and is fixed first as its own commit (`AGENTS.md` "Agent Operating
    Routine"), never folded in; a failure caused by a fix hunk is a P0 fixed
    in-session. If `build-order` was skipped, those gates were never attempted
    and need no note.
20. Amend `aar.md` with the measured gate results (loop step 7c), run `npm run
    check:fast` un-piped to `check:fast: PASS`, then `npm run session:close`.
    The close owns the commit split: one commit when the fix set touched
    `spec/`, a by-concern split when every candidate held and the increment is
    docs-only (`AGENTS.md` "Split limits").

## Decisions

- **D1 — Unit and boundary.** One verdict row per §7 `###` heading, except §7.7,
  which splits at its `####`/`#####` blocks into **four** rows: the state tiers
  and property-group table, §7.7.0 (archetypes plus the pattern-rule table),
  §7.7.1 with §7.7.1a (coupling prose and its table settle one predicate — the
  derivation check — so they share a row), and §7.7.1b. That is 10 + 4 = 14 §7
  rows. Beyond §7: one row per engine-contract block and per named code module.
  `index.ts` is reviewed only at its dispatch wrapper; the body is §5's surface
  and was swept in sweep phase 1–8.
- **D2 — Verdict vocabulary and finding IDs.** `holds`, `finding:<ID>`,
  `builder-side`, `already-reviewed:<chunk>` (worklist `D4`); a finding ID is
  `F-U3-<n>`, numbered in the order the row appears in `review.md`, so the row
  and its register entry carry the same token.
- **D3 — Fix policy.** P0 in-session, bounded to prose and to the documented
  spec surfaces this chunk reviews — `spec/04-runtime.md`,
  `docs/engine-contract.md`, and, when C-1 lands, the §4/§5/Appendix surfaces
  that carry the same range (`spec/01a-constitution.md`,
  `spec/02-requirements.md`, `spec/appendices-reference.md`); P1 scheduled with a
  dated trigger; P2 only with a demonstrated failure, bounded — otherwise
  downgraded to P3; P3 record-and-close. A demonstrated code defect is P1 (code
  edits are outside a review increment); no in-session code-fix exception
  exists.
- **D4 — Fingerprint and assembly boundary.** `spec/04-runtime.md §7.7` is
  fingerprint-bearing (`DATA_SECTIONS`) and any `spec/` edit is assembled
  (EV8, EV11); `docs/engine-contract.md` is neither. A §7.7 or §5 body edit
  therefore requires `assemble` + `build-order`; a contract-only edit requires
  neither.
- **D5 — C-1 atomicity and the chunk boundary.** The P-rule range appears in
  seven line locations across four files. A partial fix is worse than none: it
  leaves the normative REQ bodies contradicting the reviewed prose. The
  worklist's U3 boundary authorizes a body edit **with** `build-order`
  ("§7.7 is fingerprint-bearing — a REQ-body edit requires `build-order`",
  `worklist.md:167`) while its closing clause says review-only chunks change no
  body (`:167-168`). A P0 prose defect plus its body correction is not
  review-only, so the increment records that reading in `worklist.md` at step 16
  rather than claiming to be review-only. If the reviewer finds the range is
  intentionally bounded (P60/P61 excluded from the completeness rule), C-1
  becomes `holds` with the predicate recorded and no edit is made.
- **D6 — Already-reviewed blocks.** Engine contract §2–§6 are
  `already-reviewed:P5` (EV15); they are recorded in the mapping table, never
  re-reviewed.
- **D7 — No new dependency, no code behaviour change.** The increment adds no
  package, changes no runtime path, and edits no harness.

## Open questions

1. **Is the P-rule range a defect or an intentional bound?** C-1's resolution
   decides whether the increment edits seven line sites across four files. The
   evidence is decidable rather than judgemental: `holonovel/DECISIONS.md:1861`
   records the range's P1–P54 → P1–P59 expansion, so it is a maintained live
   count, and `validate.ts:1136-1175` iterates the parsed rules rather than a
   hardcoded bound. Absent a recorded deliberate exclusion of P60/P61 — there is
   none — the range is a defect and is fixed atomically (`D5`); a recorded
   exclusion would make it `holds` with the predicate cited. No user decision is
   required.
2. **Does a demonstrated code defect belong in this increment?** `D3` schedules
   it (P1) rather than fixing it, on the U2 precedent that a review chunk does
   not become a code-change chunk. There is no in-session code-fix exception;
   the finding is scheduled with a dated trigger and its evidence recorded.
