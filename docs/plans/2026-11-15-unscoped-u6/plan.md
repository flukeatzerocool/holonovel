# Plan — U6: synthesis and fixtures (unscoped-surface review sweep)

Status: draft v2 (cold pass: 4 Blockers, 7 Majors, 11 Minors, 3 Nits — every
Blocker and Major resolved below) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-15-unscoped-u6/` (created at execution
start; this draft lives in the gitignored `plans/` working area until approved)
Rollback cost: 1 (one revert: `plan.md`, `tasks.md`, `review.md`, `aar.md`, the
`plan.cold/` artifacts, the register rows, the `worklist.md` U6 status and
exit-evidence lines, `ROADMAP.md:30-31`, the bounded `spec/` prose fixes,
`holonovel.md`, `holonovel/holonovel.md`, `spec/build-phase-map.md`,
`holonovel/src/generated/g7-attestation.ts`, the generated G7 table in
`holonovel/DECISIONS.md`, `CHANGELOG.md`)
Evidence class: EV1, EV2, EV12, EV16 are `tool-output`; every other premise is a
`file:line` read or a directory listing at HEAD `5980ed2`
Trust boundary: every premise is read from the working tree; no web, user, or
fetched content enters the plan.
Review independence: fresh — cold pass recorded in `plan.cold/report.md` under
the tracked increment directory, whose hash the stamp records.

## Resolutions (cold pass v1 → v2)

- **B1 [Blocker] — the row budget skipped 74 §11 content lines.** Three units
  were unassigned: the §11.2 lead-in (`spec/08-synthesis.md:43-51`, including
  `synthesis_fingerprint` at `:49`), the §11.3 module catalogue (`:125-180`,
  the seven modules with their `synthesis://` URIs and activation actions), and
  the §11.4 heading and lead-in (`:347-355`). Rows R3, R7 and R22 now own them;
  §11 is 27 rows and the total is 66. The "every content line" claim is now
  true rather than restated at section granularity.
- **B2 [Blocker] — the fixture coverage matrix had no row.** The matrix is
  `spec/appendices-fixtures.md:1-30` and Appendix B begins at `:31`, so the one
  artifact that states which harness consumes which fixture — the chunk's
  declared lens — was outside the budget. R28 owns it, and the size claim now
  distinguishes the file (1,208 lines) from Appendices B–Z (`:31-1208`).
- **B3 [Blocker] — any spec edit fails `check:fast` through the G7
  attestation.** `check-g7-attestation` byte-compares the generated attestation
  against the assembled spec in both gate modes
  (`holonovel/scripts/generate-g7-attestation.ts`; `scripts/lib/gate-manifest.ts:108-111`),
  so V2 could never go green after a prose fix. Phase 4 step 6 now regenerates
  the attestation after the last prose edit, the blast radius carries
  `holonovel/src/generated/g7-attestation.ts` and the generated G7 table in
  `holonovel/DECISIONS.md`, and the `**Spec hash:**` line is stated to be a
  push-time sync, not this increment's.
- **B4 [Blocker] — the increment artifacts were produced out of order and
  `tasks.md` was never authored.** Phase 0 now creates the directory with
  `plan.md`, an authored `tasks.md`, and `plan.cold/`; Phase 4 numbers
  `review.md` at 4.1 and `aar.md` at 4.7; the verification table runs after 4.7
  and before the commit at 4.8, so `check-loop-artifacts` no longer runs before
  the file it checks exists.
- **M1 [Major] — V9 does not verify register anchors.** `check-anchors` runs
  `scripts/refresh-predicates.ts --check`, whose scanner matches `anchor(...)`
  calls in TypeScript only and never opens the register. V9 is relabelled as
  source anchors, the register citation rule stays heading-based (so no line
  citation needs resolution), and a per-citation `sed -n` spot-check replaces
  K3's reliance on V9.
- **M2 [Major] — V5 was report-only.** Fast mode runs `check-registers`; strict
  mode runs `check-registers:strict`
  (`scripts/lib/gate-manifest.ts:162-165`). V5 now names the strict form, which
  is what done-bar item 2 needs.
- **M3 [Major] — the done bar admitted `LOOP OPEN` while requiring
  `session:close`.** `check-loop-artifacts` errors on `LOOP OPEN` and
  `session:close` refuses it. Done-bar item 6 now requires `LOOP PAUSED`; K4
  states the uncommitted branch and stops Phase 4 step 4 from advancing the
  roadmap pointer past U6.
- **M4 [Major] — no phase wrote the CHANGELOG entry.** Phase 4 step 4.7 now
  writes the dated section that `session:close` derives the commit subject
  from, and records that the date must match the heading the commit uses.
- **M5 [Major] — the front-matter evidence classes contradicted the table.**
  Corrected to EV1, EV2, EV12, EV16 as `tool-output`.
- **M6 [Major] — "eight harness/data units" over nine rows.** Corrected, and
  the arithmetic now reads 27 + 30 + 9 = 66.
- **M7 [Major] — V8 had an undeclared Docker dependency.** `npm run check` is
  full mode and includes `check-container-image`, which builds and starts an
  image. V8 is now the Docker-free proofreading pair (`npm run lint` +
  `npm run validate:sdd`), with the full `check` named as the CI and pre-push
  authority rather than a local bar.
- **Minors m1–m11 — all fixed.** The U6 status row is `worklist.md:96`; EV11's
  `test:world-provider` anchor is `holonovel/package.json:90`; EV15 counts
  thirteen `SPEC_FILES` and anchors
  `scripts/lib/phase-map-hash.ts:18-32,36-44` and `scripts/assemble.ts:18-19`;
  the stale X/Y/Z anchors in `worklist.md:257-258` become finding **U6-F2**;
  the status wording matches U1–U5 (`**reviewed 2026-11-15** — 66 rows, …`)
  rather than `Resolved`; `holonovel/scripts/fixtures/` joins the scope as
  read-only and R58 spells the manifest path; R65 cites the emitter's default
  output and narrows its question to harnesses other than the emitter; K5 and
  Phase 3 attribute harness-exclusion to `test:all`, not EV2; the stamp binds
  the tracked `plan.cold/report.md`; and preflight is re-run with the full
  blast-radius target list.
- **Nits — fixed.** V8's note records that the full pass subsumes V2/V4/V5/V6/
  V7/V9; the skipped half of the close protocol is named as the ROADMAP half
  (the register half did run, `spec/audit/review-register.md:2787`); and the
  appendix pricing separates the file from the appendices.

## Questions

1. **What is the next roadmap item?** The § *Unscoped-surface review sweep*,
   chunk U6 (`ROADMAP.md:15-34`, `worklist.md:254-268`). The other open section
   — the loop-gate fix-up rate re-measurement — is gated on 2026-11-28 or 26
   commits (`ROADMAP.md:45-46`), and its window holds **0** commits today
   (EV16), so no work on it is permitted yet.
2. **Why does the roadmap still say U5?** `ROADMAP.md:30-31` reads "U5 is next
   … then U6–U8" while U5 closed at HEAD `5980ed2` with `LOOP PAUSED`. The
   per-chunk close protocol's step 5 — "`ROADMAP.md` trigger advanced"
   (`worklist.md:312-313`) — was half-run: the register entry exists
   (`spec/audit/review-register.md:2787`) but the roadmap pointer was not
   advanced. Phase 0 repairs it, and the miss is recorded as finding **U6-F1**.
3. **Is U6 one session?** Yes. Its surface is §11 (408 lines), the fixture
   coverage matrix plus Appendices B/C/N/W/X/Y/Z (1,208 lines), and nine
   harness/data units: 66 verdict rows, between U5's 46 and U1's 80.
4. **Does U6 change code?** No. Every row is a predicate read against an
   existing predicate; a defect that needs behaviour change is dispositioned
   `Scheduled-roadmap`, not patched. The increment's writes are prose, records,
   and regenerated assembly output — including the G7 attestation (B3).
5. **What closes the roadmap section?** Only U8 (`ROADMAP.md:33-34`). U6
   advances the pointer to U7 and leaves the section in place.

## Baseline at HEAD (this session)

| # | Evidence | Command / source | Trust |
|---|---|---|---|
| EV1 | Tree clean on `main`, 105 unpushed commits, version `2026.11.15`, 2 open roadmap sections | `git status --porcelain`; `npm run status` | tool-output |
| EV2 | Fast gate green: **45 passed, 0 failed**, trailing `check:fast: PASS`, exit 0 | `npm run check:fast` (un-piped) | tool-output |
| EV3 | The roadmap section and its stale pointer | `ROADMAP.md:15-34,30-31,33-34` | repo |
| EV4 | U6's scope, lens, already-gated list, and exit evidence | `worklist.md:254-268` | repo |
| EV5 | The per-chunk close protocol, whose ROADMAP half was skipped after U5 | `worklist.md:306-313` | repo |
| EV6 | U5 closed clean: `LOOP PAUSED`, done bar met, and the `testdata` question carried into U6 | `docs/plans/2026-11-15-unscoped-u5/aar.md` (done bar; `:71`) | repo |
| EV7 | §11 is 408 lines: lead-in `:1-18`, 11.1 `:20-42`, 11.2 `:43-124`, 11.3 `:125-346` (module catalogue `:125-180`), 11.4 `:347-408`, with 1/3/14/5 bold lead-in clauses | `wc -l spec/08-synthesis.md`; `grep -n '^### \|^\*\*'` | repo |
| EV8 | `appendices-fixtures.md` is 1,208 lines: the fixture coverage matrix `:1-30`, then Appendices B `:31`, C `:331`, N `:385`, W `:778`, X `:974`, Y `:1084`, Z `:1123` — 29 heading-level units under the matrix | `wc -l`; `grep -n '^## \|^### '` | repo |
| EV9 | The playability harness loads `holonovel/scripts/fixtures/playability/manifest.json` with **3** Novel targets and supports `--self-test` | `holonovel/scripts/playability.ts:39,48,280-295`; `grep -c '"path":'` | repo |
| EV10 | Holosuite exposes six tiers (conformance, invariants, novel, adversarial, differential, mutation) plus a separate evidence harness; mutation is report-only and excluded from `all` | `holonovel/scripts/holosuite.ts:49,56`; `holonovel/package.json:123-130` | repo |
| EV11 | The synthesis harnesses are wired: `test:world-provider` (`holonovel/package.json:90`), `test:competitive-gaps` (`:95`), `test:supplementary` (`:109`), `test:playability` (`:130`) | `holonovel/package.json` | repo |
| EV12 | `holonovel/testdata` holds **10 tracked** files (6 `rulesets/fixture`, 4 `state`) and is **not** ignored | `git ls-files holonovel/testdata`; `git check-ignore -v holonovel/testdata/state/novel-prior.json` (no match) | tool-output |
| EV13 | `check-fixture-emitter` runs `scripts/ruleset-builds/fixture/build-package.mjs --check`, which emits into a temp directory and byte-compares six files against the committed `holonovel/testdata/rulesets/fixture` (REQ-563) | `scripts/check-fixture-emitter.ts:1-20`; `build-package.mjs:32,90` | repo |
| EV14 | §11 and Appendices B–Z are **not** fingerprint-bearing: `PACKAGE_SECTIONS` and `DATA_SECTIONS` name only §5.x, §6.3, §6.4.2 and Appendix Q | `scripts/lib/contract-fingerprint.ts:27,37-43` | repo |
| EV15 | Any `spec/` edit rewrites the build-phase-map content hash, because `assemble` hashes all thirteen `SPEC_FILES` and `validate` compares the stamp | `scripts/lib/phase-map-hash.ts:18-32,36-44`; `scripts/assemble.ts:18-19`; `scripts/validate.ts:46` | repo |
| EV16 | The re-measurement window is empty: **0** commits since `2026-11-15`, and the date clause (2026-11-28) is unmet | `git log --since=2026-11-15 --format=%H \| wc -l` | tool-output |
| EV17 | The register's four disposition headings, its U5 entry, and its one pre-existing U8 cross-reference | `grep -n '^## ' spec/audit/review-register.md`; `:2787,2887` | repo |
| EV18 | `test:all` is full-gate only (56 commands) and subsumes `test:playability`; `check-g7-attestation` runs in both modes | `scripts/lib/gate-manifest.ts:108-111,245-252` | repo |
| EV19 | The U1–U5 status rows use the form `**reviewed <date>** — N rows, …`; U6's row is `:96` | `worklist.md:91-96` | repo |

## Scope

**In scope.** §11.1–§11.4 and §11's lead-in; `spec/appendices-fixtures.md`'s
fixture coverage matrix and Appendices B, C, N, W, X, Y, Z; the hosts that are
supposed to exercise them (`playability.ts`, `holosuite.ts` + its tiers,
`test-supplementary.ts`, `test-competitive-gaps.ts`, `test-world-provider.ts`,
`generate-world-provider.ts`, `holonovel/scripts/fixtures/` read-only,
`holonovel/testdata/`, `check-fixture-emitter`'s emitter); the roadmap pointer
repair; the U6 status and exit-evidence update in the program worklist.

**Out of scope.** §6's build workflows (U2), §7 (U3), §8 (U4), §9/§10/Appendix
V (U5, resolved), Appendices D–T/U (U7), README/AGENTS/content (U8), the
fix-up re-measurement (`ROADMAP.md:36-46`), and any behaviour change to a
harness. A harness that fails is a finding, not a repair.

**Lens.** `drift-report` plus fixture ↔ expectation review: for each appendix
fixture, does a named harness consume it, or is the fixture builder-side? For
each §11 clause, is there a handler (a `manage_synthesis` action, a resource,
or a `holonovel/src/core/*` predicate) or a recorded gap?

**Terminal verdict vocabulary** (inherited from U5's `review.md:3-5`):
`PASS`, `DEFECT <ID>`, `builder-side` (terminal, with a reason),
`external-skill` (terminal — not used in U6 unless a row reaches a harness
skill). No row may close on a gate's message alone; each cites the predicate.

## Row budget (66 rows)

Every content line of §11 and of the fixture matrix plus Appendices B–Z is
assigned: 27 + 30 + 9 = 66. Rows are numbered `R1`–`R66` in `review.md`; the
row-count check counts data rows only, so header and separator lines cannot
inflate it.

### Phase 1 — §11 synthesis (R1–R27)

| Row | Unit | Anchor |
|---|---|---|
| R1 | §11 lead-in: optional workflow, Pattern Buffer re-run, Wisdom present at build time | `spec/08-synthesis.md:1-18` |
| R2 | §11.1 external research requirements, dispositions, supplement audit | `:20-42` |
| R3 | 11.2 lead-in and the `synthesis_fingerprint` it names | `:43-51` |
| R4 | 11.2 auto-trigger (`TTRPG_SYNTHESIS_AUTO_TRIGGER`) | `:52-56` |
| R5 | 11.2 source inputs — seven Novel-state categories | `:57-69` |
| R6 | 11.2 synthesis rules per source category | `:70-124` |
| R7 | 11.3 module catalogue — seven modules, their `synthesis://` URIs, activation actions | `:125-180` |
| R8 | 11.3 Boundaries — what synthesis may add | `:181-187` |
| R9 | 11.3 badge scope assignment | `:188-197` |
| R10 | 11.3 budgets and caps | `:198-217` |
| R11 | 11.3 confidence and source authority | `:218-230` |
| R12 | 11.3 LOW-confidence budget | `:231-237` |
| R13 | 11.3 LOW-confidence presentation (`[LOW]` tag) | `:238-243` |
| R14 | 11.3 deduplication and conflicts | `:244-249` |
| R15 | 11.3 idempotence and the synthesis fingerprint | `:250-258` |
| R16 | 11.3 reversion (`manage_synthesis (action: revert)`, REQ-103) | `:259-264` |
| R17 | 11.3 synthesis resource rendering (every module URI) | `:265-276` |
| R18 | 11.3 partial refresh and per-module hashes | `:277-287` |
| R19 | 11.3 post-synthesis verification checks | `:288-332` |
| R20 | 11.3 copyright posture | `:333-337` |
| R21 | 11.3 rebuild scenarios | `:338-346` |
| R22 | 11.4 heading and lead-in | `:347-355` |
| R23 | 11.4 eight source bundles and their licences | `:356-368` |
| R24 | 11.4 borrowed mechanics (Fate SRD, Ironsworn SRD) | `:369-372` |
| R25 | 11.4 when vendor content runs (build-time rule) | `:373-386` |
| R26 | 11.4 pre-verified manifest and `narrative_world_model/` | `:387-406` |
| R27 | 11.4 REQ-451 vendor manifest verification | `:407-408` |

### Phase 2 — fixture matrix and appendices (R28–R57)

| Row | Unit | Anchor |
|---|---|---|
| R28 | Fixture coverage matrix — which harness consumes which fixture | `spec/appendices-fixtures.md:1-30` |
| R29 | Appendix B lead-in and fixture set | `:31-37` |
| R30 | B.1 fixture ruleset `tin_lanterns.md` | `:38-140` |
| R31 | B.2 expected model excerpt | `:141-177` |
| R32 | B.3 golden transcript | `:178-278` |
| R33 | B.4 RNG witness values | `:279-294` |
| R34 | B.5 cross-file fixture `tin_lanterns_gear.md` | `:295-330` |
| R35 | Appendix C lead-in | `:331-332` |
| R36 | C.1 injection fixture `weather.md` | `:333-345` |
| R37 | C.2 expected behaviour | `:346-366` |
| R38 | C.3 indirect-injection fixture (Novel import) | `:367-384` |
| R39 | Appendix N lead-in | `:385-395` |
| R40 | N.1 fixture files | `:396-610` |
| R41 | N.2 expected model excerpt | `:611-664` |
| R42 | N.3 golden transcript | `:665-761` |
| R43 | N.4 RNG witness values | `:762-777` |
| R44 | Appendix W lead-in | `:778-789` |
| R45 | W.1 fixture world model | `:790-813` |
| R46 | W.2 expected model | `:814-821` |
| R47 | W.3 golden transcript | `:822-955` |
| R48 | W.4 behavioural contracts exercised | `:956-973` |
| R49 | Appendix X lead-in | `:974-981` |
| R50 | X.1 social fixture `court_intrigue.md` | `:982-1058` |
| R51 | X.2 expected model excerpt | `:1059-1083` |
| R52 | Appendix Y lead-in | `:1084-1090` |
| R53 | Y.1 structural stress source | `:1091-1112` |
| R54 | Y.2 expected structural checks | `:1113-1122` |
| R55 | Appendix Z lead-in | `:1123-1130` |
| R56 | Z.0 fixture content, including the three stat blocks | `:1131-1191` |
| R57 | Z.1 expected extraction outcomes | `:1192-1208` |

### Phase 3 — assets and harnesses (R58–R66)

| Row | Unit | Anchor |
|---|---|---|
| R58 | Playability harness: manifest targets, violation classes, `--self-test` determinism | `holonovel/scripts/playability.ts:39,48,280-295`; `holonovel/scripts/fixtures/playability/manifest.json` |
| R59 | Holosuite novel tier | `holonovel/scripts/holosuite.ts`; `lib/holosuite-novel.ts` |
| R60 | Holosuite conformance and invariants tiers | `holosuite.ts` tier registry; `lib/eval-schema.ts` |
| R61 | Holosuite adversarial and differential tiers, plus the evidence harness's coverage-honesty rule | `holosuite.ts:70`; `test-holosuite-evidence.ts` |
| R62 | `test-supplementary.ts` — synthesis modules and supplementary Wisdom (REQ-265/REQ-372) | `holonovel/scripts/test-supplementary.ts` |
| R63 | `test-competitive-gaps.ts` — the competitive-gap synthesis covers | `holonovel/scripts/test-competitive-gaps.ts` |
| R64 | `test-world-provider.ts` + `generate-world-provider.ts` against Appendix W | `test-world-provider.ts:47`; `generate-world-provider.ts` |
| R65 | `holonovel/testdata/` — 10 tracked files; the C-2 question narrowed to *any writer other than the emitter*, since the emitter's default output is the tracked fixture package (EV13) | `git ls-files holonovel/testdata`; EV12/EV13; EV6 |
| R66 | `check-fixture-emitter` and `build-package.mjs` — the one sanctioned reference package | `scripts/check-fixture-emitter.ts:1-20` (REQ-563) |

## Phase 0 — precondition (before the first row)

1. `git status --porcelain` must be empty and `git rev-parse --short HEAD` must
   be `5980ed2`; otherwise re-baseline the evidence table before proceeding.
2. `npm run check:fast`, un-piped, must print `check:fast: PASS` and
   `45 passed, 0 failed` (EV2). A red baseline is fixed first as its own
   commit, never folded into this increment.
3. Re-evaluate the re-measurement trigger (EV16). If ≥26 commits exist since
   `2026-11-15` or the date is on/after 2026-11-28, record the number and route
   that section through Phase 5 of
   `docs/plans/2026-11-15-unscoped-u5/plan.md` in a later session; do not mix
   it into U6.
4. Repair `ROADMAP.md:30-31`: the pointer reads "U6 is next (synthesis and
   fixtures), then U7–U8" while U6 is open. The section's bullets, trigger, and
   admission shape are unchanged, so `check-roadmap` stays green.
5. Record the half-run close-protocol step as finding **U6-F1** (a process
   defect, `Resolved` by step 4) and the stale X/Y/Z appendix anchors in
   `worklist.md:257-258` as **U6-F2** (`Resolved` when the plan's own R49/R52/
   R55 anchors replace them), so the register — not the roadmap diff — carries
   the lessons.
6. Complete the increment directory: it already holds `plan.cold/` with the
   cold pass; add `plan.md` (this document) and an authored `tasks.md` (one task
   per phase, one sub-task per row group, the verification table and the commit
   as the final tasks). `review.md` and `aar.md` are written in Phase 4, not now.

## Phase 1 — §11 (R1–R27)

For each row: read the clause, name the predicate that would satisfy it (a
`manage_synthesis` action, a `synthesis://` resource, a
`holonovel/src/core/*.ts` symbol, or a harness assertion), and settle the row.
The exit evidence is `worklist.md:266-268`: every clause maps to a handler or a
recorded gap.

Probes to run first, because they bound what a row can claim:

1. `grep -rn 'manage_synthesis' holonovel/src` — the action surface R7, R16,
   R17 and R18 must resolve to.
2. `grep -rn 'synthesis://' holonovel/src` — the module catalogue (R7) and
   resource rendering (R17).
3. `grep -rn 'SYNTHESIS_AUTO_TRIGGER' holonovel/src` — R4's trigger.
4. `grep -rn 'SynthFingerprint\|synthesis_fingerprint' holonovel/src` — R3,
   R15 and R18.
5. `grep -rn '\[LOW\]' holonovel/src` — R13's tag.

A clause with no predicate is a `DEFECT`; its disposition is
`Scheduled-roadmap` when it needs behaviour change and a prose repair when the
clause over-claims. Neither is patched in this session.

## Phase 2 — fixture matrix and Appendices B/C/N/W/X/Y/Z (R28–R57)

R28 settles the coverage matrix first, because it states the very mapping the
other 29 rows verify — a matrix that names a harness the row cannot find is the
chunk's most likely class of defect.

For each appendix the exit evidence is `worklist.md:266-267`: the fixture is
**exercised by a named harness** or recorded **builder-side with a reason**.

Per row:

1. Name the fixture artifact the appendix specifies (e.g. `tin_lanterns.md`)
   and probe for it: `git ls-files | grep tin_lanterns`, `find . -name
   'weather.md'`.
2. Name the harness that would consume it: the fixture emitter (R66), the
   playability manifest (R58), a holosuite tier (R59–R61), or a synthesis
   harness (R62–R64).
3. If no harness consumes it, the row's verdict is `builder-side` **only with a
   reason** — the appendix is a handoff artifact for a builder operating from
   the published spec, not a repo fixture. The reason is recorded in the row.
4. If an appendix or the matrix claims that a harness consumes it and none
   does, the row is a `DEFECT` — the coverage claim is the predicate.

Line 30 of `ROADMAP.md` names this chunk's exit evidence; it does not promise
that every fixture is executable. A `builder-side` verdict with a recorded
reason satisfies the bar; an unrecorded one does not.

## Phase 3 — assets and harnesses (R58–R66)

Rows R58–R66 change no file. Each runs one command, records its exit status and
its claim, and compares the harness's assertions against the appendix it is
supposed to mirror.

Evidence runs (all use temp data dirs or read the tracked tree without writing):

| Row | Run | Notes |
|---|---|---|
| R58 | `npm --prefix holonovel run test:playability` | `--all --self-test`; assert the violation classes it reports |
| R59–R61 | `npm --prefix holonovel run test:holosuite-{conformance,invariants,novel,adversarial,differential,evidence}` | Six commands; record each exit status. Mutation is report-only and out of scope (EV10) |
| R62 | `npm --prefix holonovel run test:supplementary` | |
| R63 | `npm --prefix holonovel run test:competitive-gaps` | |
| R64 | `npm run test:world-provider` | Root form; the server form exists too (EV11) |
| R65 | `git status --porcelain holonovel/testdata` before and after the runs | A writer other than the emitter is the C-2 finding |
| R66 | `npm run check-fixture-emitter` | Already green in `check:fast` (EV2); the row records what the emitter covers |

A red harness is a finding, not a repair: its row is `DEFECT` and the finding
is dispositioned. The done bar does not require harness greenness; the suite
that would reveal it is `test:all`, which is full-gate only (EV18), not the
fast baseline.

## Phase 4 — disposition and close

1. **(4.1)** Write `review.md` with 66 rows, numbered `R1`–`R66`, each carrying
   its predicate and verdict.
2. **(4.2)** Write each `DEFECT` into `spec/audit/review-register.md` under a
   `### 2026-11-15 U6 synthesis and fixtures` entry, with the predicate in
   `file:line`, the disposition, and the closing commit. Cite sections by
   heading, never by line (`docs/plans/2026-11-15-unscoped-u5/aar.md:71-75`,
   condition C-1); each `file:line` citation that does survive is confirmed
   with `sed -n '<line>p' <file>`.
3. **(4.3)** Update `worklist.md`: the U6 row at `:96` becomes
   `**reviewed 2026-11-15** — 66 rows, X P0 fixed, Y P1 scheduled, Z P3
   closed (…/review.md)` in the U1–U5 form (EV19); the U6 section's existing
   `**Exit evidence:**` line (`:266-268`) is amended to match U4's form
   (`worklist.md:204-237`); and that section's **Prose** line (`:256-258`)
   takes this plan's appendix anchors — X `:974`, Y `:1084`, Z `:1123` —
   replacing the stale `:970`/`:1080`/`:1119`, which closes U6-F2.
   `Resolved` is reserved for the roadmap close wording.
4. **(4.4)** Advance `ROADMAP.md:30-31` to U7 and leave the section's trigger
   intact — **only** when Phase 4 completes; on the K4 branch the pointer stays
   at U6.
5. **(4.5)** Apply only the bounded prose fixes the review demonstrated. Prose
   fixes stay inside `spec/08-synthesis.md` and `spec/appendices-fixtures.md`.
   A fix that needs a code or harness change is `Scheduled-roadmap`.
6. **(4.6)** Regenerate in order after the last prose edit: `npm run assemble`
   (rewrites `holonovel.md`, `holonovel/holonovel.md`, and the build-phase-map
   content hash — EV15), then
   `npx tsx holonovel/scripts/generate-g7-attestation.ts` (rewrites the
   attestation and its G7 table) — B3. The `**Spec hash:**` line in
   `holonovel/DECISIONS.md` is synced at push time, not here.
7. **(4.7)** Write `CHANGELOG.md`'s dated section (the commit subject derives
   from its heading, so the date must be the heading the commit will use), then
   `aar.md` with the done-bar verdict and the terminal token.
8. **(V)** Run the verification table below, un-piped, recording each exit
   status.
9. **(4.8)** `npm run session:close` — one commit.

## Blast radius

| Surface | Files | Change |
|---|---|---|
| Prose (bounded) | `spec/08-synthesis.md`, `spec/appendices-fixtures.md` | S — only demonstrated defects |
| Generated | `holonovel.md`, `holonovel/holonovel.md`, `spec/build-phase-map.md`, `holonovel/src/generated/g7-attestation.ts`, the G7 table in `holonovel/DECISIONS.md` | M — regenerated by 4.6 |
| Records | `spec/audit/review-register.md`, `ROADMAP.md`, `docs/plans/2026-11-10-unscoped-surface-review/worklist.md`, `CHANGELOG.md` | S–M |
| Increment | `docs/plans/2026-11-15-unscoped-u6/{plan,tasks,review,aar}.md`, `plan.cold/` | M — new files |
| Not touched | server source and harnesses, `holonovel/scripts/fixtures/`, `holonovel/testdata`, gate scripts, `contract-fingerprints.ts` | — |

`spec/build-phase-map.md` and the attestation are in the blast radius because
any spec edit moves them (EV15, B3); `check-fingerprint-sync` stays green
because no `PACKAGE_SECTIONS`/`DATA_SECTIONS` member is edited (EV14). Both are
verified below rather than assumed.

## Verification

Run un-piped, each with its exit status captured:

| # | Command | Expected |
|---|---|---|
| V1 | `npm run assemble` | exit 0; build-phase-map hash updated |
| V2 | `npm run check:fast` | `45 passed, 0 failed`, `check:fast: PASS` |
| V3 | `grep -cE '^[|] R[0-9]' docs/plans/2026-11-15-unscoped-u6/review.md` | 66 |
| V4 | `npm run check-loop-artifacts` | pass — plan/tasks/AAR present, `LOOP PAUSED` present |
| V5 | `npm run check-registers:strict` | pass — every register row dispositioned |
| V6 | `npm run check-roadmap` | pass — 2 sections, pointer reads U7, trigger intact |
| V7 | `npm run check-fingerprint-sync` | pass — no fingerprint-bearing section touched (EV14) |
| V8 | `npm run lint` and `npm run validate:sdd` | 0 errors; proofreading warnings are informational |
| V9 | `npm run check-anchors` | pass — TypeScript source anchors resolve (does **not** cover Markdown `file:line` citations, which 4.2 spot-checks with `sed -n`) |

V3's pattern is `^[|] R[0-9]` and counts data rows only: the header row and the
separator carry no `R<digit>`. V8 is the Docker-free substitute for
`npm run check`, which full mode runs with `check-container-image` (needs a
Docker daemon), `test:all` and `test:pipeline` (~3+ min each); CI and the
pre-push hook remain the authority for the full pass, and it subsumes V2, V4,
V5, V6, V7 and V9 rather than adding new evidence.

## Risks and rollback

| # | Risk | Mitigation |
|---|---|---|
| K1 | An appendix fixture has no executable counterpart, so 30 rows collapse into one finding | The `builder-side` verdict with a recorded reason is the settlement; the row still carries evidence. This is the likely shape, not a failure. |
| K2 | A harness writes into tracked `holonovel/testdata` and dirties the tree mid-session | R65 probes `git status --porcelain holonovel/testdata` before and after; the probe is the finding, and the commit excludes any drift. |
| K3 | Prose fixes shift line anchors the register cites | Register entries cite headings (4.2), and each surviving `file:line` is confirmed with `sed -n`; V9 does not cover Markdown citations. |
| K4 | 66 rows exceed the session | The AAR records the truth: unrun rows stay `UNSET`, the increment is **not** committed, the chunk stays open as `U6b` in `worklist.md`, and the ROADMAP pointer stays at U6. |
| K5 | A harness is red at baseline | It is a finding with a predicate, not a repair; `test:all` (EV18) is the suite that surfaces it, and it is not part of the fast baseline. |

Rollback: `git revert <commit>` restores every file in the blast radius at once,
including the regenerated assembly output and attestation. Cost 1 — reversible,
no external state, no migration.

## Commit plan

One commit, via `npm run session:close` (a spec increment stays one commit per
`AGENTS.md`). The commit must pass V1–V9 before it is made; a failing tree stops
and reports rather than committing. On the K4 branch no commit is made at all.

## Done bar

**Done bar:** this increment is done when all of the following hold:

1. `review.md` carries 66 rows, `R1`–`R66`, and no row is `UNSET`.
2. Every `DEFECT` row appears in `spec/audit/review-register.md` with a
   terminal disposition (V5).
3. `worklist.md:96` records the U6 session in the U1–U5 form and the U6 section
   carries its exit-evidence line.
4. `ROADMAP.md:30-31` names U7 next and the section trigger is unchanged (V6).
5. V1–V9 pass, each recorded un-piped with its exit status.
6. `aar.md` states the done-bar verdict against this list and ends
   `LOOP PAUSED` — `LOOP OPEN` means the increment is not committed (K4).
7. One commit, subject derived from the top CHANGELOG heading.

Not part of the bar: closing the roadmap section (U8 does that), any harness
turning green, any code change, and the fix-up re-measurement (still
date-gated).

## Open questions

1. **Does U6 need a fixture that does not exist?** No. The chunk reviews whether
   the appendices' fixtures are exercised; it does not add executables. If a
   fixture is genuinely missing and the matrix claims it ships, that is the
   finding, not the deliverable.
2. **Should `builder-side` rows reduce the row count?** No. The row is what
   carries the reason; collapsing it would hide the settlement the exit
   evidence asks for.
