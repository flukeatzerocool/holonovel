# Cold review — U6 plan (`plans/2026-11-15-unscoped-u6.md`)

Reviewer: review subagent (DeepSeek V4.1 Flash)
Plan sha256: 763cd09dc43e2b8c64516edee4e20811325865e2b5bbaa1ff120cf099a080e31
Stages: 5/5 read (stage 4 re-zoom not triggered — no artifact edits during
review) · Reads: 39/40
Verdict: FAILED — 4 Blockers, 7 Majors, 11 Minors, 3 Nits

## Stage 2 — comprehension (pass: faithful-with-gaps)

U6 is the sixth chunk of an unscoped-surface review sweep. It audits §11 and
fixture Appendices B/C/N/W/X/Y/Z against the harnesses that are supposed to
exercise them, settling one verdict per unit — `PASS`, `DEFECT`, or
`builder-side` with a reason — in a 62-row `review.md`. No code changes: prose
repairs only where a clause over-claims, findings into the review register with
terminal dispositions, the worklist U6 row updated, and the roadmap pointer
advanced from U5 to U7. Done means 62 settled rows, register rows dispositioned,
worklist and ROADMAP updated, V1–V9 green, an AAR ending in a LOOP token, and
one commit via `session:close`. Not determinable from the document: which rows
own `spec/08-synthesis.md:43-51`, `:125-180`, and
`spec/appendices-fixtures.md:1-30`; where `tasks.md` is composed; how the G7
attestation is refreshed.

## Blockers

**B1 [Blocker][design] — Row budget skips 74 content lines in §11, including
the whole module catalogue.** `plans/2026-11-15-unscoped-u6.md:90` claims "Every
content line of §11 … is assigned", but R2 ends at `:42` and R3 starts at `:52`,
leaving `spec/08-synthesis.md:43-51` (the §11.2 lead-in, including
`synthesis_fingerprint` at `:49`); R5 ends at `:124` and R6 starts at `:181`,
leaving `spec/08-synthesis.md:125-180` — the §11.3 "Output modules" block that
names all seven modules, their `synthesis://` URIs, and their activation
actions, i.e. exactly what R13/R14/R15/R16 are said to "resolve to"; R19 ends at
`:346` and R20 starts at `:356`, leaving `spec/08-synthesis.md:347-355` (11.4
heading + lead-in). Correction: either add rows for `:43-51`, `:125-180` (or
seven module rows), and `:347-355` and raise the total above 62, or restate the
claim at section granularity ("every §11.N subsection is assigned") and drop the
line-coverage promise.

**B2 [Blocker][design] — The fixture coverage matrix is unassigned.**
`spec/appendices-fixtures.md:1-30` is `## Fixture Coverage Matrix`, and Appendix
B begins at `:31`; R25 (`:127`) begins at 31, so the 30-line matrix has no row.
It is the single artifact that states which harness consumes which fixture — the
chunk's declared lens (`plan:78-81`). The plan also prices the appendix at
"1,208 lines" (`:31`), which only holds if the matrix counts. Correction: add a
row for `spec/appendices-fixtures.md:1-30`, and correct `:31` to describe 1–1208
or 31–1208 precisely.

**B3 [Blocker][design] — Any spec edit fails `check:fast` through the G7
attestation, so V2 can never go green as written.**
`scripts/generate-g7-attestation.ts:159` hashes the entire assembled spec into
`SPEC_HASH`, and `:203-204`/`:212` byte-compare and exit 1; the gate runs in
both modes (`scripts/lib/gate-manifest.ts:108-111`). Phase 4 step 5
(`:273-276`) permits prose edits to `spec/08-synthesis.md`/
`spec/appendices-fixtures.md`, and V2 (`:306`) then requires `45 passed, 0
failed`. No step re-runs the generator, and `:292` declares fingerprints "not
touched". U5 records precisely this consequence
(`docs/plans/2026-11-15-unscoped-u5/aar.md:78-79`, "apart from the generated
attestation's spec hash"). Correction: add
`npx tsx holonovel/scripts/generate-g7-attestation.ts` after the last prose fix
and before V1; add `holonovel/src/generated/g7-attestation.ts` and the generated
G7 table in `holonovel/DECISIONS.md` to the blast radius; state that the
`**Spec hash:**` line is synced at push time, not by this increment.

**B4 [Blocker][design] — Increment artifacts are produced out of order and
`tasks.md` is never authored.** `docs/plans/README.md:23` and
`scripts/lib/loop-artifacts.ts:36-38,66-72` require `plan.md`, `tasks.md`,
`aar.md`. Phase 0 step 6 (`:189-191`) declares the directory will contain all
four files plus `plan.cold/`, before Phase 4 writes `review.md` (`:262`) and
`aar.md` (`:279`); no step composes `tasks.md`; and Phase 4 step 6 (`:276-278`)
runs "the verification table below" — including V4 `check-loop-artifacts`
(`:308`) — before `aar.md` exists, so V4 fails deterministically. Correction:
Phase 0 step 6 = mkdir + copy `plan.md`, authored `tasks.md`, `plan.cold/`; move
`review.md` to 4.1 and `aar.md` to 4.7 as already numbered; move the V-table to
after 4.7 and before 4.8.

## Majors

**M1 [Major][design] — V9 does not verify register anchors.** `check-anchors` is
`scripts/refresh-predicates.ts --check` (`package.json:94`), whose scanner only
matches `anchor("path", line, "symbol")` calls inside TS sources
(`scripts/refresh-predicates.ts:24,74-77`); it never opens
`spec/audit/review-register.md`. V9 (`:313`) therefore passes vacuously and K3's
mitigation (`:325`) is void. Correction: relabel V9 "source anchors resolve;
does not cover markdown `file:line` citations", and either drop K3's reliance on
it or add a manual `sed -n '<line>p' <file>` spot-check per register citation
(the heading-only citation rule at `:266-268` already covers most of the risk).

**M2 [Major][design] — V5 is report-only.** Fast mode runs `npm("check-registers")`;
full mode runs `npm("check-registers:strict")`
(`scripts/lib/gate-manifest.ts:162-165`), and the script exits 0 while reporting
findings unless `--strict` (`scripts/check-registers.ts:8-10,34`). V5's
"pass — every register row dispositioned" (`:309`) is not what the named command
asserts, yet done bar 2 (`:344-345`) binds to V5. Correction: make V5
`npm run check-registers:strict`, or re-point done bar 2 at V8.

**M3 [Major][clarity] — Done bar 6 contradicts items 4–5 and Phase 4 step 8.**
`:350` and K4 (`:326`) permit `LOOP OPEN`; `check-loop-artifacts` errors on it
(`scripts/lib/loop-artifacts.ts:82-89`) and `session:close` refuses it
(`docs/plans/README.md:53-54,66`), while step 8 (`:281-282`) commits via
`session:close`. Correction: done bar 6 → "ends `LOOP PAUSED`"; K4 → the unrun
rows stay `UNSET`, the increment is not committed, the chunk stays open as U6b,
and Phase 4 step 4 must then **not** advance `ROADMAP.md` past U6.

**M4 [Major][structural] — No CHANGELOG step.** `CHANGELOG.md` is in the blast
radius (`:290`) and step 8 derives the commit subject from its top heading
(`:281-282`; `docs/plans/README.md:75`), but no phase writes the entry.
Correction: add "write the dated `CHANGELOG.md` section" as Phase 4 step 3.5
(before the V-table), and note the date must equal the heading the commit will
use.

**M5 [Major][clarity] — Front-matter evidence classes contradict the Baseline
table.** `:11` says "EV2, EV8, EV9, EV15 are `tool-output`"; the table marks EV8
`repo` (`:51`), EV9 `repo` (`:52`), EV15 `repo` (`:58`), and marks EV12/EV16
`tool-output` (`:55`,`:59`). Correction: `:11` → "EV1, EV2, EV12, EV16 are
`tool-output`; every other premise is a `file:line` or listing read".

**M6 [Major][clarity] — Unit-count contradiction.** `:31-32` says "eight
harness/data units", but Phase 3 defines nine rows R54–R62 (`:159-169`).
Correction: "nine". (Row arithmetic itself is sound: 24 + 29 + 9 = 62.)

**M7 [Major][design] — V8 has an undeclared Docker dependency.** `npm run check`
is `npm run gates -- --full` (`package.json:63`), and full mode includes
`check-container-image` (`scripts/lib/gate-manifest.ts:96-99`), which builds and
starts an image. A session without a Docker daemon fails V8 and therefore done
bar 5. Correction: record Docker as a prerequisite for V8 or name the narrow
substitute (`npm run validate --sdd-strict` + `npm run lint` + the proofreading
pass), and note V8 also pulls in `test:all` and `test:pipeline` (~3+ min).

## Minors

- **m1** `:269` "the U6 status row (`:95` table)" → `worklist.md:96` (U5's row is
  `:95`, the likely copy source).
- **m2** EV11 `:54` cites `holonovel/package.json:51` for `test:world-provider`;
  it is at `:90` (`:51` is `"./package.json"` in `exports`). The other three
  anchors (`:95`, `:109`, `:130`) are correct.
- **m3** `:58` "assemble hashes all twelve spec files" → thirteen
  (`scripts/lib/phase-map-hash.ts:18-32`).
- **m4** EV15 ranges drift: `phase-map-hash.ts:34-40` should be `:36-44`
  (`computeSpecContentHash`); `assemble.ts:14` should be `:18-19` (the two output
  paths).
- **m5** Stale worklist anchors left unreconciled: `worklist.md:257-258` gives X
  `:970` / Y `:1080` / Z `:1119`; the plan's own R45/R48/R51 use
  `:974`/`:1084`/`:1123`. Record as a U6 finding or correct `worklist.md` (the
  plan updates only the status row and exit-evidence line).
- **m6** Status vocabulary drift: U1–U5 rows read `**reviewed 2026-11-15** — N
  rows …` (`worklist.md:91-95`); the plan writes "becomes `Resolved`" (`:269`,
  `:346`). Correction: `**reviewed 2026-11-15** — 62 rows, …`, reserving
  `Resolved` for the ROADMAP close wording at `ROADMAP.md:33-34`.
- **m7** Scope omits `holonovel/scripts/fixtures/*`, which `worklist.md:259`
  assigns to U6 and which holds the manifest R54 reads
  (`holonovel/scripts/playability.ts:39`). R54's anchor
  `fixtures/playability/manifest.json` (`:161`) is also path-ambiguous.
  Correction: add the directory to Scope as read-only and spell the path
  `holonovel/scripts/fixtures/playability/manifest.json`.
- **m8** R61 is answered by R62's own subject: the emitter's default output *is*
  `holonovel/testdata/rulesets/fixture`
  (`scripts/ruleset-builds/fixture/build-package.mjs:32,90`), and
  `check-fixture-emitter` byte-compares it. Correction: cite that in R61 and
  narrow it to "does any harness other than the emitter write there".
- **m9** K5 (`:327`) and `:258` attribute the exclusion to "the baseline gate
  (EV2)", but EV2 is `check:fast`, which does not run playability — it is
  full-gate only via `test:all` (`scripts/lib/gate-manifest.ts:249-254`;
  `worklist.md:264`). Correction: "the done bar does not require harness
  greenness; the baseline that would reveal it is `test:all`, not EV2".
- **m10** The stamp path is untracked: `plans/*` is ignored (`.gitignore:13`), so
  `:15-16`'s "cold pass recorded in `plans/2026-11-15-unscoped-u6.cold/`, whose
  hash the stamp records" binds the gate to an ignored path. Correction: stamp
  the tracked copy `docs/plans/2026-11-15-unscoped-u6/plan.cold/report.md`.
- **m11** The evidence sidecar's `targets` array names 8 paths and omits files
  the plan writes — `holonovel.md`, `spec/build-phase-map.md`, `CHANGELOG.md`,
  `holonovel/src/generated/g7-attestation.ts`. Correction: re-run `preflight`
  with the full blast-radius target list after B3 is fixed.

## Nits

- V8 (`npm run check`) already subsumes V2, V4, V5 (strict), V6, V7 and V9;
  listing them separately is fine as staging but should say so, otherwise they
  read as independent evidence.
- `:25-29` says step 5 "was not run"; the register half of step 5
  (`worklist.md:312`) did run — the `## Resolved — 2026-11-15 U5 …` heading
  exists at `spec/audit/review-register.md:2787`. Say "the ROADMAP half of step 5
  was not run".
- `:30-31` prices "Appendices B/C/N/W–Z" at 1,208 lines; that number includes the
  matrix and any post-Z tail, so it is the file's size, not the appendices' size.

## Verified (no finding)

- Plan sha256 matches; HEAD is `5980ed2`; 105 unpushed commits
  (`git log origin/main..HEAD`); 0 commits `--since=2026-11-15`, 28 since
  `2026-11-14`.
- `ROADMAP.md:30-31` does still read "U5 is next … then U6–U8";
  `worklist.md:306-313` is the close protocol with step 5 at `:312-313`.
- EV7 ranges and `wc -l` 408 are exact; every §11.3 row boundary from R6–R19 is
  exact. Every appendix row boundary R25–R53 is exact, and EV8's "29 units" (7
  `## Appendix` + 22 `###`) holds.
- EV12: 10 tracked files, 6 + 4, exact. EV9: 3 manifest targets, `:39`/`:48`
  exact. EV10: `holosuite.ts:49` tier union, `:56` mutation-excluded. EV13: six
  files, `:1-20`. EV18: 56 commands, `:245-252`.
- EV14 holds: `PACKAGE_SECTIONS`/`DATA_SECTIONS`
  (`contract-fingerprint.ts:27,37-43`) contain no §11 or B–Z member; the
  phase-map hash does cover both files, so any edit rewrites it
  (`phase-map-hash.ts:18-32,36-44`), and `validate` treats staleness as a
  warning only — `assemble` rewriting it first makes V1/V7 consistent.
- All named commands exist with the stated names: `assemble`, `check:fast`,
  `check`, `check-loop-artifacts`, `check-registers`, `check-roadmap`,
  `check-fingerprint-sync`, `check-anchors`, `check-fixture-emitter`,
  `session:close`, and all six `test:holosuite-*` plus `test:playability`,
  `test:supplementary`, `test:competitive-gaps`, `test:world-provider`.
- No new gate is added, so no duplicate-check risk; `check-fixture-emitter` is
  already fast+full, so R62's "already green in `check:fast`" is right.

## Unknowns

- `npm run check:fast` printed "45 passed, 0 failed" — asserted as
  `tool-output`; not re-run here (read-only dispatch).
- Whether `assemble` leaves the phase-map hash current such that `validate`'s
  warning stays silent — logical from `assemble.ts` writing
  `writePhaseMapHash`, not executed.
- Stage isolation is collapsed (nesting prohibited); a fully staged
  five-context pass could surface a clarity finding this pass missed.
- The reviewer's context was injected with `holonovel/AGENTS.md`, which was not
  in its dispatch list; it did not change any finding but it weakens isolation.

`independent-review FAILED.` — 4 Blockers.
