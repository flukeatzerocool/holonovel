# Plan — U2: build process and tooling review (chunk 2 of 8)

Status: draft v3 (self pass resolved 2 own errors; cold pass PASS with 6 Majors,
all fixed — see Resolutions) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-14-unscoped-u2/`
Rollback cost: 1 (one revert: `review.md` and `cold-review.md` (new), register
rows, `worklist.md` status line, the roadmap trigger line, the bounded prose fix
set, `contract-fingerprints.ts` **only if** §6.3/§6.4.2 is corrected,
`holonovel.md` + `holonovel/holonovel.md`, `CHANGELOG.md`)
Evidence class: repo (two `tool-output` commands, EV1/EV2, recorded with the
exact command; every other premise is a `file:line` read at HEAD `4fab90e`)
Trust boundary: every premise is read from the working tree at HEAD `4fab90e`;
no web, user, or fetched content enters the plan.
Review independence: **fresh** — cold pass recorded in `cold-review.md`

## Resolutions (self pass v1 → v2)

- **S1 — the prose bar was wrong for §6.** v1 required every corrected paragraph
  to clear the grade-12 bar at `validate.ts:626-635`. That bar covers only the
  §0–§4 narrative (`:630-637`); §6–§11 are **reference prose** scored at grade 18
  (`:639-650`), with the 45-word sentence cap and condition stacking alongside
  (`:651-654`). D3 and task 13 now cite the correct predicate, and the map's own
  prose is recorded as outside the assembled artifact entirely.
- **S2 — the prose baseline was asserted, not measured.** v1 promised "warnings
  ≤ baseline" without a number. The baseline is 296 warnings, of which 286 are
  proofread-registered (`npm run validate:sdd`, exit 0 at HEAD). The verification
  table now carries both figures.

## Resolutions (cold pass v2 → v3)

Six Majors, no Blockers. Every one was a defect in the verification chain rather
than in the review's premise, and every one is fixed above the line where it
would have bitten.

- **M1 — `build-order` cannot run before the AAR.** `build-order` step 2 runs
  `npm run check` whenever `spec/` changed (`scripts/build-order.ts:220-229`),
  and `check` includes `check-loop-artifacts`, which errors on a missing
  `aar.md`. Both places that scheduled it ran it first. Phase 4 is now ordered
  fix → bookkeeping → **AAR** → gates (including the conditional
  `build-order`) → AAR amendment → `check:fast` → close, which is the loop's own
  step order (`docs/plans/README.md:43-50`). There is no narrower regeneration
  command: `package.json` exposes only `check-fingerprint-sync` (a gate), not a
  fingerprint writer, so `build-order` is the only path and its position is
  forced. `check-container-image` runs in full mode
  (`scripts/lib/gate-manifest.ts`) and is recorded as an environment Unknown
  rather than a promise.
- **M2 — `check-registers` is report-only by default.** It exits 1 only under
  `--strict` (`scripts/check-registers.ts:9-10,54`), so "exit 0" was evidence of
  nothing. Every invocation is now `npm run check-registers -- --strict`.
- **M3 — the register structure lost Scheduled-roadmap attribution.** A row
  appended under a bare `## Scheduled-roadmap` inherits the preceding `###`
  block, and the roadmap cross-check only fires for a finding whose
  `section.startsWith("Scheduled-roadmap")`
  (`scripts/lib/register-checks.ts:25-35,64-67`). The plan now requires one
  dated `### 2026-11-14 U2 …` heading **per disposition section that receives
  rows**, matching the U1 precedent's two headings.
- **M4 — the map-row verdict rule inverted the predicate.** `checkPreparePhaseMap`
  requires each token the *directive* lists to appear in the *row*
  (directive ⊆ row, `scripts/validate.ts:1370-1376`). v2 stated the reverse
  (row ⊆ directive), which would have recorded a real gate error as `holds` on
  15 of 35 rows. Phase 2 step 9 now states the enforced direction.
- **M5 — `holonovel/holonovel.md` was missing from the blast radius.** `assemble`
  writes both the root artifact and the reference-implementation mirror
  (`scripts/assemble.ts:6-7,19,154-156`), so any prose fix dirties the second
  file too. It is now a blast-radius row, and `version-bump`'s targets
  (`build-order.ts:251-254`) are recorded as idempotent at the current
  `2026.11.14` rather than silently omitted.
- **M6 — EV9 overclaimed its own command.** "No git hook is named anywhere in
  the specification" rested on a top-level `spec/*.md` grep. A recursive grep
  finds nine hook references under `spec/audit/**` (review and remediation
  registers), including hook-line predicates. EV9 and D8 now say **top-level
  spec sources**, and name the `spec/audit/**` hits as an out-of-chunk U8
  dependency (`worklist.md:82`). The conclusion is unchanged.
- **Minors folded.** The map's file-index row *is* machine-checked (`C-7`), so
  it is no longer described as otherwise; `checkStaleCounts` lists ten nouns,
  not five (the digit-count conclusion stands); the pre-push anchors are
  `:47` (version-check) and `:58` (spec-delta); the grade-12 range is
  `:630-637`; `checkAgentsMapFreshness` is called at `:2481`; the
  finding-count parity check compares **distinct IDs**, not lines; D4's
  "confirmed at task 18" step was vacuous and is retired on U1's precedent
  (`review.md` already ships and is accepted); the surface-to-scenario row
  spans the mapping table **and** the `#### Holonovel Pattern Buffer` block
  (`spec/03-build.md:1745`), so it is labelled accordingly; and C-4 reads "no
  predicate links the workflow table to the phase rows" rather than "none links
  them".

## Questions

1. **Which roadmap item is next?** `ROADMAP.md:15-32` — the Unscoped-surface
   review sweep (P2). Its `**Trigger:**` (`:30-32`) names the next allocated
   review session as **U2, build process and tooling**; U1 closed on 2026-11-14
   and advanced the trigger (`docs/plans/2026-11-10-unscoped-surface-review/worklist.md:91`).
   The three other open items are later: harness test-ID hygiene, anchor repoint
   automation, and the loop-gate re-measurement dated 2026-11-28.
2. **What does U2 owe?** `worklist.md:134-150` defines the chunk: prose
   `spec/03-build.md` §6 and `spec/build-phase-map.md`; code
   `scripts/{assemble,build-order,spec-update-record,spec-propagate,spec-delta,update,update-server,version-bump,status}.ts`
   and `.githooks/{pre-commit,pre-push,commit-msg}`; lens `drift-report` plus
   `code-review`; exit evidence is *every §6 phase maps to a script or a recorded
   gap, the map's file-index counts match the spec, and each hook's failure mode
   is named*.
3. **Is the chunk session-achievable?** Measured below: 35 verdict rows over
   ~2,155 prose lines and ~2,290 lines of named tooling. The map's 15 phase rows
   and its file-index row are the units that carry a machine-checked claim; §6
   is mostly builder-side prose. No split is planned; a forced split is recorded
   as a `D-split` amendment in `worklist.md`, never used as a done-bar escape
   hatch.
4. **What counts as a finding here?** Two classes, because the chunk's lens is
   two-lens: (a) *drift* — §6 or the map claims a mechanical verification the
   repository does not perform, or contradicts the predicate it cites; (b)
   *code* — a named script or hook does not deliver what its header, AGENTS.md,
   or the workflow it implements says. A §6 phase that is builder-executed with
   no repository check is `builder-side`, not a gap (`D2`).

## Baseline at HEAD (this session)

| # | Evidence | Command / source | Trust |
|---|---|---|---|
| EV1 | Tree clean on `main`, HEAD `4fab90e`, 91 unpushed commits, oldest 5.9 d, version `2026.11.14`, 4 open roadmap items | `npm run status`, `git status --porcelain` | tool-output |
| EV2 | Fast gate green: 41 passed, 0 failed, `check:fast: PASS` | `npm run check:fast` (un-piped) | tool-output |
| EV3 | The roadmap item and its trigger | `ROADMAP.md:15-32` | repo |
| EV4 | Chunk U2 prose, code, lens, gates, exit evidence, and boundary | `worklist.md:134-150` | repo |
| EV5 | §6 measures 14 numbered `###` subsections plus two unnumbered ones inside §6.6 — the worklist's "16 subsections" is exact; 6 `*Prepare:*` directives exist (§6.3, §6.4, §6.4.2, §6.5, §6.6, §6.7) | `grep -n '^### ' spec/03-build.md`; `grep -c '\*Prepare:\*' spec/03-build.md` | repo |
| EV6 | The map has **15** phase rows, a 13-row file index, one loading-conventions block, and one peak-working-set claim; `spec/` holds **14** `.md` files (the map omits itself) | `spec/build-phase-map.md:11-27,36-61`; `ls spec/*.md` | repo |
| EV7 | §6.3 and §6.4.2 are **package-format fingerprint sections**; §6.4 and §6.5 are not fingerprinted | `scripts/lib/contract-fingerprint.ts:5,27` | repo |
| EV8 | Phase-map enforcement is split by severity: `*Prepare:*` forward consistency is an **error**, the map's content hash and the §5-subsection count are **warnings** | `scripts/validate.ts:1332-1374` (error at `:2487-2491`), `:1405-1413` and `scripts/lib/req-checks.ts:128-140` (warnings at `:2464-2471`) | repo |
| EV9 | No git hook is named in a **top-level spec source**; the only hook references under `spec/` are nine occurrences in `spec/audit/**` (review and remediation registers), including hook-line predicates — that tree is U8's surface | `grep -rn 'pre-commit\|pre-push\|commit-msg' spec/*.md` — zero hits; `grep -rn … spec/` — 9 hits under `spec/audit/` | repo |
| EV10 | Named tooling sizes: `assemble.ts` 169, `build-order.ts` 300, `spec-update-record.ts` 234, `spec-propagate.ts` 36, `spec-delta.ts` 221, `update.ts` 189, `update-server.ts` 426, `version-bump.ts` 161, `status.ts` 108; hooks 53/139/52 | `wc -l` (a single `tool-output` command) | tool-output |
| EV11 | Delta classification is pure and unit-testable: `classifyDelta` returns `none|patch|editorial|minor|major`; "patch" requires **no** added/removed/modified REQ and no section change | `scripts/lib/spec-delta-classify.ts:25,35-49` | repo |
| EV12 | §6.1 lists four workflows (Convert, Build, Synthesize, Update) with a "Required sections" cell per row; the map lists 15 phases; §6 carries 6 `*Prepare:*` directives — three rosters, and no predicate links the workflow table to the phase rows | `spec/03-build.md:3-14`; `spec/build-phase-map.md:11-27` | repo |
| EV13 | `build-order` regenerates the contract fingerprints as step 1b, so `D5`'s regeneration path exists; it runs the **full** `check` whenever `spec/` changed, so it cannot precede the AAR | `scripts/build-order.ts:3,13,188-205,220-229` | repo |
| EV14 | Readability is scoped by section: §0–§4 narrative at grade 12, **§6–§11 reference prose at grade 18** with a 45-word sentence cap; `build-phase-map.md` is not part of the assembled artifact, so its prose is not scanned | `scripts/validate.ts:630-655`; `scripts/assemble.ts:48-60` (CORE_FILES + appendices only) | repo |
| EV15 | `check-registers` is report-only unless `--strict` is passed; `check-roadmap` exits 1 on findings | `scripts/check-registers.ts:9-10,54`; `scripts/check-roadmap.ts:246` | repo |
| EV16 | `assemble` writes **two** artifacts — `holonovel.md` and the reference-implementation mirror `holonovel/holonovel.md` | `scripts/assemble.ts:6-7,19,154-156` | repo |

## Surface inventory (the row budget)

One row per unit, as `D1` defines the unit. The row count is the done bar's
countable form.

| Surface | Anchor | Rows |
|---|---|---|
| §6.1 Workflow overview (4 workflows) | `spec/03-build.md:3-14` | 1 |
| §6.2 Intake (Convert, G0, viability pre-check) | `:15-201` | 1 |
| §6.3 Discovery | `:202-443` | 1 |
| §6.4 Server construction (6-step table) | `:444-494` | 1 |
| §6.4.1 Prompt composition | `:495-540` | 1 |
| §6.4.2 Package step | `:541-604` | 1 |
| §6.5 Verification and convergence | `:605-822` | 1 |
| §6.5.1 No-delta detection | `:823-832` | 1 |
| §6.5.2 Cross-model audit | `:833-860` | 1 |
| §6.5.3 Adjusted thresholds and unbuildable disposition | `:861-906` | 1 |
| §6.5.4 Finding taxonomy | `:907-919` | 1 |
| §6.5.5 Convergence result caching | `:920-978` | 1 |
| §6.6 The Pattern Buffer (37 sub-workflows) | `:979-1367` | 1 |
| §6.6 Surface-to-scenario mapping table and the `#### Holonovel Pattern Buffer` block it contains | `:1368-1925` | 1 |
| §6.6 Holonovel REQ Pattern Buffer coverage map | `:1926-1999` | 1 |
| §6.7 Spec-driven updates (delta classes, fingerprint comparison) | `:2000-2155` | 1 |
| map phase rows (15) | `spec/build-phase-map.md:13-27` | 15 |
| map header claim block (single source of truth; delegation) | `:5-9` | 1 |
| map loading conventions | `:36-43` | 1 |
| map file index (13 rows, one unit) | `:45-61` | 1 |
| map token footnote and peak-working-set claim | `:29-34` | 1 |
| **Total** | | **35** |

The file index is one row for the same reason U1's terminology table was one
row: it is a roster whose membership `scripts/assemble.ts:120-126`
(`ALLOWED_SOURCE_FILES`) already enforces, so the row records that fact plus the
`C-6` membership check.

## Enforcement surface to map against

Read once in Phase 1; each row cites the predicate it resolved to, not a gate's
message (`AGENTS.md` "Finding evidence").

| Consumer | Anchor | Severity today | Contract |
|---|---|---|---|
| `assemble` (build tool) | `scripts/assemble.ts:18-19,120-132,159-165` | exit 1 on a bad roster | regenerates `holonovel.md`, the mirror, and the map hash |
| `checkPreparePhaseMap` | `scripts/validate.ts:1332-1374` | **error** (`:2487-2491`) | directive → map row, forward only |
| `checkPhaseMapHash` | `:1405-1413`; `scripts/lib/phase-map-hash.ts:36-50` | **warning** | map hash matches the 13 hashed sources |
| `checkBuildPhaseMapCounts` | `scripts/lib/req-checks.ts:128-140` | **warning** | the file index's "35 subsections" matches `### 5.N` |
| `checkStaleCounts` | `scripts/validate.ts:753-769` | **warning** | number-words only (`one`…`twelve`) and ten nouns; a digit count of another noun is invisible |
| `checkAgentsMapFreshness` | `:2132,2481-2482` | **warning** | AGENTS.md's layer map names every appendix |
| `check-fingerprint-sync` | gate manifest | **error** | `contract-fingerprints.ts` matches the assembled spec |
| `check-registers --strict` | `scripts/check-registers.ts:9-10,54` | **error only with `--strict`** | register rows carry structure and dispositions |
| `check-roadmap` | `scripts/check-roadmap.ts:246` | **error** | roadmap sections are admission-rule shaped |
| `check-gate-table` | gate manifest | **error** | AGENTS.md's table equals the manifest |
| `check-loop-artifacts` | gate manifest | **error** | increment carries plan/tasks/AAR with a terminal token |
| `check-guarded-rule-change --base <ref>` | `scripts/check-guarded-rule-change.ts` | **error** | Appendix M edit + validator pattern in one diff needs a register entry |
| `build-order` (build tool) | `scripts/build-order.ts:220-229,251-254` | exit 1 | assemble → **full `check`** (so it needs `aar.md`) → propagate → source-propagate → typecheck → version sync |
| `version-check` | `.githooks/pre-push:47` | blocks the push | version fields agree |
| `spec-delta --report-only` | `.githooks/pre-push:58` | blocks the push | classifies the pending update |
| `spec-update-record --check` | publish step 5b | blocks publication | a delta has a dated, verified entry |
| pre-commit | `.githooks/pre-commit` | blocks the commit | fast suite, guarded co-change, gate-run record |
| pre-push | `.githooks/pre-push` | blocks the push | version sync, pending-update, propagation, harnesses, full check |
| commit-msg | `.githooks/commit-msg` | blocks the commit | `YYYY-MM-DD — <title>`, ≤120 chars, no trailing period |
| `test:spec-tooling`, `test:commit-plan`, `test:pipeline` | gate manifest | **error** | self-tests for assembly, the commit planner, and the hooks |

`scripts/run-gates.ts` is U4's; `scripts/publish/*`, `push-pipeline.sh`, and
`scripts/session-close.ts` are U5's (`worklist.md:142,150`). Those scripts are
read only where a §6 claim cites their behaviour.

**Hooks have no top-level spec anchor (EV9).** They are repository
infrastructure: a `drift-report` cannot review them against prose that does not
exist in a spec source, so their rows are code-reviewed against their own headers
and `AGENTS.md`'s operating routine. The `AGENTS.md` side of that comparison,
and the nine `spec/audit/**` hook references, are U8's surface
(`worklist.md:82`); that coupling is recorded in the program-record note in
Phase 4, not duplicated here.

## Pre-review candidates

Each candidate is checked against its predicate in Phase 2. A candidate that
does not survive becomes `holds` with the predicate cited; it is not a finding
and is not restated in the register.

| ID | Claim to test | Probe |
|---|---|---|
| C-1 | **Flagship.** The map says "Each phase's `*Prepare:*` directive in §6 lists the exact files" (`:41-42`), but 15 phase rows carry 6 directives (EV5/EV6), and `checkPreparePhaseMap` validates only directive→row, never row→directive | `grep -n '\*Prepare:\*' spec/03-build.md`; read `validate.ts:1343-1380` for the iteration direction |
| C-2 | §6.7's **Editorial** class covers "spec tooling or verification-only edits" (`:2022`), but a tooling-only change touches no REQ and no section, so `classifyDelta` returns **patch** (`scripts/lib/spec-delta-classify.ts:47`) | run `npm run spec-delta -- --base HEAD~3` against a tooling-only commit; compare the emitted class with the table |
| C-3 | §6.7's **Patch** class is "spec wording only" (`:2021`), yet `patch` requires *no modified REQ*, so a wording-only edit inside a REQ body classifies as `minor` unless an Editorial disposition exists (`:46-48`) | `git log --oneline -20 -- spec/02-requirements.md`; pick a wording-only commit; run `spec-delta` on it |
| C-4 | Three rosters disagree with no predicate linking them: §6.1's four workflows and their "Required sections" (`:3-14`), the map's 15 phases (`:11-27`), and §6's 6 `*Prepare:*` directives (EV12). `checkPreparePhaseMap` links directive ↔ row only; nothing reads §6.1's table | diff the three sets by hand; confirm no script reads §6.1's table (`grep -rn "Required sections" scripts/`) |
| C-5 | The map's **peak working set** is "~8,000 tokens (Convergence)" (`:33`), while the Convergence row states 9,200 (`:18`); the 73% figure derives from 8,000/30,000 | arithmetic on `:18,27,33-34` |
| C-6 | The file index lists 13 files; `spec/` holds 14, the map omitting itself; `assemble` rejects any spec `.md` outside `ALLOWED_SOURCE_FILES` (`scripts/assemble.ts:120-132`) | `ls spec/*.md \| wc -l`; read `assemble.ts:120-132` |
| C-7 | The file index declares "§5, 35 subsections"; the spec has 35 `### 5.` headings; the predicate is a **warning**, while `AGENTS.md`'s checklist lists the count as guarded | `grep -c '^### 5\.' spec/02-requirements.md`; `req-checks.ts:128-140`; `validate.ts:2464-2471` |
| C-8 | "37 sub-workflows" is asserted twice (`:1743`, `:2024`); the §6.6 enumeration carries S1–S37; `checkStaleCounts` cannot see a digit-numeral count of a noun it does not list | `grep -oE '\bS[1-9][0-9]?\b' spec/03-build.md \| sort -uV`; `validate.ts:755-757` |
| C-9 | §6.6 names the harness as `scripts/run_pattern_buffer.ts` (`:1332,1755`); the file lives at `holonovel/scripts/run_pattern_buffer.ts` and is wired as `test:pattern-buffer` | `ls holonovel/scripts/run_pattern_buffer.ts`; `holonovel/package.json:75`; confirm §6 addresses the server tree (`spec/03-build.md:489`) |
| C-10 | §6.4's construction table is described as audited "in two batches … Steps 1–3 … Steps 4–6" (`:612-616`); the table must actually carry six steps | `sed -n '460,495p' spec/03-build.md` |
| C-11 | §6.7's "five implementation fingerprint components (REQ-313)" (`:2035`) must match REQ-313a/313b and the `T497` binding | read `spec/02-requirements.md:2143-2156`; count the named components |
| C-12 | Pre-commit's and pre-push's headers claim a recorded gate run replaces the old environment marker; the record must exist and be keyed on tree + content hash | `.githooks/pre-commit:8-14`; `scripts/lib/gate-run-manifest.ts`; `run-gates.ts --recorded` |

## Objective

Close chunk U2 with an evidence-backed verdict for every unit of its declared
surface, so the question "does the build process the spec describes correspond
to the tooling that actually runs, and is the build-phase map internally true?"
is answered once, durably, in the register's disposition vocabulary.

## Done bar

**Done bar:** 35 verdict rows with a cited predicate, every finding terminally
dispositioned, zero unfixed P0, the program record advanced, and the gates green
— the numbered list below is the authoritative form.

1. `review.md` in this directory holds **35 verdict rows** (counted by
   `grep -cE '^\| [0-9]+ \|' review.md`) — the "Surface inventory" table is the
   budget — each carrying surface, anchor, a verdict (`holds` /
   `finding:<ID>` / `builder-side`), and the predicate or declaration that
   settles it (`file:line`).
2. Every non-`holds`, non-`builder-side` row carries a finding ID, and every
   finding ID has a terminal disposition in `spec/audit/review-register.md`:
   `Resolved`, `Scheduled-roadmap` (with a matching `ROADMAP.md` section),
   `Closed-P3`, or `Deferred-by-user`.
3. All twelve pre-review candidates are resolved to `holds` or a finding; none
   is left "unverified".
4. Zero P0 findings remain unfixed. Each P1 is on `ROADMAP.md` in
   admission-rule shape (1–3 bullets plus one `**Trigger:**`); `check-roadmap`
   passes. If Phase 3 shows more P0s than the bounded fix set in `D3` allows,
   stop and amend the plan rather than escalating the prose rewrite silently.
5. `worklist.md:92` records U2 as reviewed with its exit evidence, the hook
   boundary note (EV9), and the next chunk; the `ROADMAP.md` trigger
   (`:30-32`) names U3.
6. The gates pass un-piped, each with its exit code captured, **after** `aar.md`
   exists (because `build-order` runs the full `check`, and `check` includes
   `check-loop-artifacts`), in dependency order: `npm run assemble` (only if a
   `spec/` file changed) → `npm run check-registers -- --strict` → `npm run
   check-roadmap` → **`npm run build-order` when §6.3 or §6.4.2 was edited**
   (`D5`) → `npm run check-fingerprint-sync` → the guarded co-change check on
   the staged fix set (the `--base` form cannot see an uncommitted diff). Then
   `aar.md` is amended with the measured results (loop step 7c), `npm run
   check:fast` prints `check:fast: PASS`, and `npm run session:close` commits.
7. No §5 REQ body changes; no push; the map's content hash is unchanged by any
   map-only edit (`D6`). `aar.md` records the row count, the finding count by
   severity, the class assigned to any delta produced by the fix set, and the
   gate results.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-14-unscoped-u2/{plan,tasks,review,aar}.md` | new increment record; `review.md` is the 35-row verdict table (increment-local artifact, `D4`) | L (new content) |
| `docs/plans/2026-11-14-unscoped-u2/cold-review.md` | the cold-pass report (review evidence, not a verdict row) | S |
| `spec/audit/review-register.md` | one dated `### 2026-11-14 U2 build process and tooling` heading **per disposition section that receives rows** (`Resolved`, and `Scheduled-roadmap`/`Closed-P3`/`Deferred-by-user` as the findings require) — a row appended under a bare `##` heading inherits the preceding `###` block and loses its disposition (`scripts/lib/register-checks.ts:25-35,64-67`) | S–M |
| `docs/plans/2026-11-10-unscoped-surface-review/worklist.md` | status line `:92` gains exit evidence, closure, and the hook boundary note | S |
| `ROADMAP.md` | trigger line `:30-32` names U3; a new section only if a P1 finding schedules work | S |
| `spec/03-build.md` | bounded P0 prose corrections (`D3`); expected ≤12 lines, **none in §6.3 or §6.4.2** unless `D5` fires | S |
| `spec/build-phase-map.md` | bounded P0 corrections (C-1, C-5); does not change the file's own content hash (`D6`) | S |
| `holonovel/src/generated/contract-fingerprints.ts` | **conditional** — only if `D5` fires (a P0 in §6.3/§6.4.2); regenerated by `build-order`, never hand-edited | S |
| `spec/audit/proofread-register.md` | **conditional** — only if a readability warning is accepted rather than fixed | S |
| `holonovel.md` | regenerated by `npm run assemble` if a `spec/` file changed | S |
| `holonovel/holonovel.md` | the reference-implementation mirror `assemble` also writes (`scripts/assemble.ts:19,154-156`) — dirty whenever the root artifact is | S |
| version fields (`package.json`, `holonovel/package.json`, `holonovel/src/index.ts`, `server.json`, `AGENTS.md`, `holonovel/DECISIONS.md`, lockfile) | **conditional and moot while the version is unchanged** — `build-order` step 5 runs `version-bump`, idempotent at the current `2026.11.14`, so all of these stay byte-identical unless a version input moved (`scripts/build-order.ts:251-254`) | S |
| `CHANGELOG.md` | dated entry, `2026-11-14` | S |

Not touched: §5 REQ bodies, `scripts/**`, `holonovel/src/**` outside the
conditional fingerprint file, `spec/audit/req-coverage.md`, `.githooks/**` (read
only), the roadmap's other sections.

## Phases and tasks

### Phase 1 — Build the mapping, then read

1. Read each consumer in the enforcement table once; record what it tests and
   whether it errors, warns, blocks, or only reports. Stop at
   `validate.ts:2455-2495` once severity is settled (EV8).
2. Read `scripts/lib/phase-map-hash.ts` and `scripts/assemble.ts:110-169` to
   settle what the map hash covers and what assembly regenerates (EV7, `D6`).
3. Read `scripts/lib/spec-delta-classify.ts` in full (62 lines) and the
   `shape` it is fed at `scripts/spec-delta.ts:190-200`; this settles C-2, C-3,
   and C-11.
4. Read the three hooks once and record each one's failure mode, its exit-code
   contract, and the gate-run record it consults (C-12). Read
   `scripts/lib/gate-run-manifest.ts` only far enough to confirm the record's
   key.
5. Read `scripts/version-bump.ts` and `scripts/spec-update-record.ts` far
   enough to settle C-3's "record version bump in DECISIONS.md" and the
   Editorial disposition's writers; stop at the first writer that settles it.
6. Create `review.md`: header, mapping table, 35 empty numbered rows with
   surface and anchor.

### Phase 2 — Write the verdicts

7. §6.1–§6.7 (16 rows): for each subsection record whether it carries a
   mechanical claim. A subsection that instructs the builder (audit cadence,
   thresholds, taxonomy) is `builder-side` unless it names a repository check;
   a subsection that claims `mechanical` verification (`:1433`, `:1932`) is a
   finding only when the named check does not exist.
8. The four cross-cutting §6 claims are read against their predicates rather
   than their prose: the "37 sub-workflows" count (C-8), the `run_pattern_buffer`
   path (C-9), the two-batch construction audit (C-10), and the delta table
   (C-2, C-3).
9. Map phase rows (15 rows): the gate's direction is **directive ⊆ row** — each
   token the section's `*Prepare:*` directive lists must appear in the row's
   files cell (`validate.ts:1370-1376`). A row that omits a file the directive
   names is therefore a **finding**, not `holds`; a row with no directive is a
   finding **only if** the map's own claim (C-1) says otherwise, since the
   missing directive is the single C-1 finding rather than fifteen duplicates.
10. Map header, loading conventions, file index, and peak-set rows (4 rows):
    apply C-1, C-5, C-6, C-7. The file index's other 12 rows are checked as
    membership against `assemble.ts:120-126` in the same row.
11. Resolve C-4 (three rosters), C-11 (five fingerprint components), and C-12
    (the gate-run record) against their predicates; record the three hooks'
    failure modes in `review.md`'s mapping table rather than as verdict rows —
    confirm each hook's stated failure mode is the one it implements, and that a
    bypass (`--no-verify`) is named where it exists (`.githooks/commit-msg:8-11`).

### Phase 3 — Triage and fix (`D3`)

12. Rank findings P0–P3 exactly as `AGENTS.md` "Review-loop governance"
    defines them. P0 = demonstrated wrong prose or a wrong stated mechanism,
    fixed in-session. P1 = a load-bearing rule whose check is genuinely missing
    — scheduled on `ROADMAP.md`. P2 needs a demonstrated failure. P3 =
    record-and-close.
13. Apply the P0 prose corrections. Constraints: no §5 body edits; no
    simultaneous edit of Appendix M and `scripts/lib/req-checks.ts` /
    `scripts/validate.ts` (that is the self-attesting co-change
    `check-guarded-rule-change` blocks without a register entry — if a fix needs
    both, schedule the check as P1 instead); re-read each edited paragraph
    against the **reference-prose** bar (`validate.ts:639-654` — grade 18, no
    sentence over 45 words, no stacked conditions), which is the bar that
    governs §6; the grade-12 narrative bar (`:630-637`) applies only to §0–§4
    and does not constrain this chunk. The `proseReadability`/`referenceProse`/
    `referenceSentLen` warning counts must not increase (baseline: 296 total,
    286 proofread-registered).
14. **If a P0 lands in §6.3 or §6.4.2**, record it now and run `npm run
    build-order` at step 19 — not here. `build-order` runs the full `check`
    (`scripts/build-order.ts:220-229`), and `check` includes
    `check-loop-artifacts`, which fails until `aar.md` exists, so the command
    cannot precede step 19. There is no narrower function: `package.json`
    exposes only the `check-fingerprint-sync` **gate**, not a fingerprint
    writer (`D5`). A §6.3/§6.4.2 fix without regeneration is a gate failure, not
    a bookkeeping miss.
15. Write the register entries with one dated `### 2026-11-14 U2 build process
    and tooling` heading per disposition section that receives rows; each row
    cites the predicate (`file:line`) that settles it. Scheduled rows get their
    `ROADMAP.md` section in the same step (`check-registers --strict` couples
    them).

### Phase 4 — Bookkeeping, AAR, gates, close

The loop's order (`docs/plans/README.md:43-50`) puts the AAR before the gates
that read it, and `build-order` reads it. Steps 18–19 are therefore AAR-then-
gates, and step 20 amends the AAR with the measured results (loop step 7c).

16. Update `worklist.md:92` with U2's exit evidence and the EV9 note; edit the
    `ROADMAP.md` trigger to name U3.
17. Write the `CHANGELOG.md` entry dated `2026-11-14`.
18. Write `aar.md` (row count, findings by severity, dispositions, delta class,
    gate results) ending `LOOP PAUSED`. If the AAR earns `LOOP OPEN`,
    disposition the named item first and re-run — the close refuses `LOOP OPEN`.
19. Run the gates un-piped, capturing each exit code, **now that `aar.md` exists**,
    in dependency order: `npm run assemble` (only if a `spec/` file changed) →
    `npm run check-registers -- --strict` → `npm run check-roadmap` →
    `npm run build-order` **conditionally** (`D5`) → `npm run
    check-fingerprint-sync` → the guarded co-change check on the **staged**
    fix set (`git add` the changed files, then `npm run
    check-guarded-rule-change`). `build-order` precedes `check-fingerprint-sync`
    because that gate fails until `build-order` regenerates the constant;
    `build-order` runs the full `check`, so if `check-container-image` cannot
    run in this environment, record it as an environment Unknown in the AAR
    rather than as a pass. A bare `check-guarded-rule-change -- --base HEAD` is
    a no-op — `--base` inspects `git diff <ref>..HEAD`
    (`scripts/check-guarded-rule-change.ts:81-83`), which cannot see an
    uncommitted fix set — so only the staged mode verifies this change.
20. Amend `aar.md` with the measured gate results (loop step 7c), then `npm run
    check:fast` un-piped (`check:fast: PASS`), then `npm run session:close`
    (which re-runs the fast suite and commits).

## Readings (decisions taken in this plan)

- **D1 — the row is the unit, and the budget is the count.** §6's 16 `###`
  subsections are 16 rows (sections are not further subdivided, matching U1's
  §1–§3 treatment); the map contributes 15 phase rows plus 4 structural blocks
  (header claim, loading conventions, file index, peak set). `16 + 19 = 35`.
  A verdict is one of `holds`, `finding:<ID>`, or `builder-side`; there is no
  `n/a` — an inapplicable unit is `holds` with the reason.
- **D2 — builder-side is the default for §6.** §6 instructs a builder that
  runs outside this repository (audit cadence, thresholds, finding taxonomy,
  convergence loops). Those rows are `builder-side` with the instruction
  cited. A finding requires a claim of *repository-mechanical* verification, or
  a contradiction with a predicate that does exist.
- **D3 — fix the prose or schedule the check, never both in one increment.**
  When the prose overclaims, correcting it is in-session (P0). When the rule is
  load-bearing and the prose is right, the missing check is P1 and goes to
  `ROADMAP.md`. The bounded fix set is ~12 lines across §6 and the map; beyond
  that is a plan amendment, not an improvisation. The map is not part of the
  assembled artifact (EV14), so a map edit is not readability-scanned; a §6 edit
  is, at grade 18.
- **D4 — `review.md` is increment-local.** `docs/plans/README.md:15-19`
  documents plan/tasks/AAR; the verdict table is this chunk's evidence artifact
  and U1 established the name. `check-loop-artifacts` has no extra-file
  allowlist but does not reject extra files, and U1 already ships `review.md`
  through a green close — so no confirmation step is needed.
- **D5 — §6.3 and §6.4.2 are fingerprinted; the rest of §6 is not.** EV7 puts
  both in the package-format set, so a correction there invalidates
  `holonovel/src/generated/contract-fingerprints.ts` and `check-fingerprint-sync`
  fails until `build-order` regenerates it — and `build-order.ts:188-205` does
  exactly that as step 1b (EV13). This is the one way U2 differs from U1. The
  regeneration runs at step 19, after the AAR, because `build-order` also runs
  the full `check` (`:220-229`). If the fix set avoids both sections, no
  regeneration runs and the rollback cost stays 1.
- **D6 — the map's hash covers the sources, not the map.** `phase-map-hash.ts`
  hashes the 13 content files and excludes the map itself, so editing
  `build-phase-map.md` neither changes nor requires the hash; `assemble`
  rewrites it only when a hashed source moved. The map row therefore does not
  force an assembly regeneration on its own.
- **D7 — three rosters are one finding, not three.** The §6.1 workflow table,
  the map's phase rows, and the `*Prepare:*` directives are three rosters for
  the same thing (EV12), and no predicate links the first to the other two. C-1
  records the map's overclaim and C-4 records the missing link once; neither is
  restated per row.
- **D8 — hooks are reviewed as code, not as drift.** EV9 shows no *top-level*
  spec anchor. Their rows live in the mapping table with the `AGENTS.md` and
  `spec/audit/**` comparisons flagged as U8 dependencies, so the program does not
  double-review that surface here.
- **D9 — findings are `F-U2-<n>`.** The series continues per chunk; register
  placement follows the existing file's sections.

## Alternatives considered

- **Review only `spec/03-build.md` and skip the map.** Rejected: the map is the
  chunk's only machine-checked surface (`checkPreparePhaseMap`,
  `checkPhaseMapHash`, `checkBuildPhaseMapCounts`), so skipping it would leave
  the three predicates unreviewed and the exit evidence unmet.
- **Review only the tooling and skip §6 prose.** Rejected: the lens is
  `drift-report`; without the prose side there is nothing to drift *from*.
- **Treat every §6 phase as a finding when no script is named.** Rejected: §6
  states contracts, not implementations (`AGENTS.md` "Spec editing"), and the
  builder runs outside this repo. D2 makes those `builder-side`.
- **Gate `checkBuildPhaseMapCounts` and `checkPhaseMapHash` as errors while
  reviewing them.** Rejected: promoting a warning to an error is a
  validator-behaviour change with its own self-tests and a `check-guarded-rule-change`
  consequence. If the review concludes the warning severity is wrong, that is a
  P1 scheduling item, not an in-session edit (`D3`).
- **Fix C-1 by adding nine `*Prepare:*` directives.** Rejected as the default:
  it edits nine locations of buyer-facing prose for a builder that may not need
  them. C-1 is fixed by making the map's claim true in the direction that
  survives review — either the sentence narrows to the phases that carry a
  directive, or the reverse check becomes P1. Phase 2 decides which, on
  evidence.
- **Run the cold pass as a re-read in this context.** Refused: `plan-review` §8
  requires an independent reviewer at standard depth; a same-context re-read is
  not a cold pass.

## Edge cases and rollback

- **A candidate dissolves.** Record `holds` with the predicate; do not keep the
  hypothesis in the register (C-1…C-12 are plan scaffolding, not findings).
- **C-1 and C-4 turn out to be the same defect.** Merge them into one finding
  with both anchors; the row verdicts stay as written.
- **A P0 fix would exceed ~12 lines.** Stop and amend the plan. A large prose
  rewrite is a different increment and would break the grade-12 budget; a
  demonstrated P0 is never silently scheduled.
- **A P0 lands in a fingerprinted section.** Step 19 runs `build-order` after the
  AAR; the blast radius gains one generated file and the rollback cost stays 1
  because the generator is deterministic.
- **`check-registers --strict` collides.** It couples `Scheduled-roadmap` rows to
  roadmap sections; write both in the same step (step 15), and give each
  disposition section that receives rows its own dated `###` heading.
- **`check-loop-artifacts` is red until `aar.md` exists.** Expected: the
  directory is a working increment, and this is why `build-order` (which runs the
  full `check`) sits after the AAR rather than before it. The `check:fast` and
  close steps run last (steps 19–20).
- **Rollback:** one `git revert`. `review.md` is additive, the register rows
  are additive, a conditional prose fix is a small hunk set, and the
  conditional fingerprint file is generated.

## Verification

| Check | Command | Expected |
|---|---|---|
| Row budget | `grep -cE '^\| [0-9]+ \|' docs/plans/2026-11-14-unscoped-u2/review.md` | 35 |
| Finding-count parity | distinct IDs: `grep -oE 'F-U2-[0-9]+' review.md \| sort -u \| wc -l` vs the same over `spec/audit/review-register.md` | equal |
| Assemble (conditional) | `npm run assemble` | exit 0 |
| Registers | `npm run check-registers -- --strict` | exit 0 |
| Roadmap admission | `npm run check-roadmap` | exit 0 |
| Fingerprints | `npm run check-fingerprint-sync` | exit 0 |
| Guarded co-change | `git add` the fix set, then `npm run check-guarded-rule-change` (staged mode; `--base HEAD` is a no-op on an uncommitted diff) | exit 0 (or acknowledged by a register entry) |
| Map hash after a map-only edit | `npm run validate` | `PASS: build-phase-map content hash is current` |
| Prose budget | `npm run validate:sdd` | 296 warnings / 286 registered or fewer; 0 errors |
| Fast gate (after AAR) | `npm run check:fast` (un-piped) | `check:fast: PASS` |

## User impact

None at runtime. No tool, schema, output, or persisted-state change; no restart
or migration. Maintainers gain `review.md` — the §6/build-phase-map
rule-to-consumer map — plus register rows for every gap it demonstrates. A P0
fix changes spec prose only. If the fix set touches §6.3 or §6.4.2, the
package-format fingerprint constant is regenerated, which is a server build
artifact and not a behavioural change.

## Deferred / scheduled

- Everything U2 finds and does not fix lands in `spec/audit/review-register.md`
  with a terminal disposition, and any P1 lands on `ROADMAP.md`.
- Chunks U3–U8 stay scheduled; the trigger advances to U3 at close.
