# Tasks — Roadmap drain 10: REQ evidence linkage chunk 9

Increment: `docs/plans/2026-11-17-roadmap-drain-10` · Plan: `plan.md` (revision 3)
Baseline the plan was written against: git HEAD `66fa82d`, tree clean, `check:fast` PASS
(46/46), `validate` 0 errors with 50 linkage findings.

Tick a task only when its acceptance line is satisfied; `aar.md` (P5) records
the readings, not the ticks.

## P1 — Dry run, tasks list, dispositions

- [ ] `npm run validate` reproduces `REQ evidence linkage: 50 finding(s)` and 0 errors.
- [ ] `T205` pre-edit: 40 DECISIONS rows at `holonovel/DECISIONS.md:272-311`, `#` column
      contiguous 1..40, runtime set 39 + 1 in the same order (set- and order-equal).
- [ ] `T297` pre-edit: 8 witness rows × 10 faces match the LCG; 3 seed-pinned bracketed
      arrays in B.3 match.
- [ ] `T106` pre-edit: `2026.11.16` satisfies `^\d{4}\.\d{2}\.\d{2}$` and matches the
      DECISIONS `| Spec version |` row.
- [ ] `dispositions.md` written: one row per finding
      (`| REQ | T-ID | class | cite | home | action |`) plus the unclaimed-clause record
      for `T205`, `T297`, `T106`.
- [ ] Stop rule honoured: no source write before every predicate above clears.

## P2 — `T205` (REQ-082b)

- [ ] `function checkBriefingTokenRegistry(text: string): string[]` in
      `scripts/validate.ts`, called from `main()` beside `:2686`.
- [ ] Five clauses implemented: row shape, contiguous numbering, order equality, set
      equality, `[INVALID_INPUT]` enumeration binding.
- [ ] Missing marker and missing `narrative_threads` each fail with `T205`.
- [ ] Accept: nothing reported on the unmodified tree; `validate` → 49 findings.
- [ ] Probe: retoken one DECISIONS row → `T205` failure → restore.

## P3 — `T297` (REQ-277)

- [ ] `function checkFixtureWitness(text: string): string[]` in `scripts/validate.ts`.
- [ ] B.4 and N.4 tables reproduce from the LCG; B.3 arrays reproduce; d6 die size pinned;
      unknown die column or unresolved move is a fail-loud `T297` parse error.
- [ ] Accept: nothing reported; `validate` → 48 findings.
- [ ] Probe: one B.4 face → `npm run assemble` → `T297` failure → restore both → re-assemble
      → `git diff --stat holonovel.md` empty.
- [ ] Probe: one B.3 die value → same sequence, restored.

## P4 — `T106` (REQ-107b)

- [ ] `function checkVersionCoordination(rootVersion: string, decisionsVersion: string |
      null): string[]` in `scripts/version-check.ts`, called before the exit gate.
- [ ] CalVer shape, DECISIONS equality, real-calendar-date check implemented; `T493`
      untouched.
- [ ] Accept: nothing reported; `npx tsx scripts/version-check.ts` exits 0; `validate` →
      47 findings.
- [ ] Probe: DECISIONS spec-version row → failure → restore.
- [ ] Probe: root version day `2026.11.6` → failure → restore `package.json`.

## P5 — Registers, artifact, gates

- [ ] `ROADMAP.md` item 3 restated: 47 rows, the three T-IDs, ≤3 bullets.
- [ ] `spec/audit/review-register.md`: `### 2026-11-17 — REQ evidence linkage chunk 9`
      under `## Scheduled-roadmap`.
- [ ] Corpus regenerated: `npm run validate -- --write-linkage-corpus
      docs/plans/2026-11-15-req-evidence-linkage/corpus.md` (49 lines, 47 rows).
- [ ] Coverage register regenerated: `npm run validate -- --write-register`; diff recorded.
- [ ] `aar.md` written with its terminal token already present (`LOOP PAUSED`).
- [ ] V1–V9 run and recorded (V3 last, un-piped, trailing `check:fast: PASS`).
- [ ] `aar.md` finalised (probe evidence, changelog block, terminal token confirmed).
- [ ] `npm run session:close --single` commits the increment as one commit.
