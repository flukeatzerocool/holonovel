# Tasks — U4: verification workflows and CI

Dependency-ordered breakdown of `plan.md`. Task IDs mirror the plan's numbered
steps one-for-one (T1–T21), so the AAR can cite either form. Each task names the
artifact it leaves behind.

## Phase 1 — Build the mapping, then read

- [x] **T1** Read `scripts/run-gates.ts` in full (252 lines): both modes' failure
  propagation, the advisory path, `--list`/`--recorded`, and the timing record.
  Artifact: four enforcement-table rows with a severity each.
- [x] **T2** Read `scripts/lib/gate-manifest.ts:25-292` and capture the gate
  inventory (44 names, 3 full-only, the `advisory` field and its retirement file
  at `:297-312`). Artifact: the mapping spine; no gate body read yet.
- [x] **T3** Read `.github/workflows/ci.yml` (56 lines) once and classify every
  step as a manifest gate, a direct script, or a composite chain. Artifact: the
  CI step classification used by `C-3`.
- [x] **T4** Read `holonovel/scripts/run-test-suite.ts` and
  `holonovel/scripts/test-harness-guard.ts`: the suite's 56 commands, its
  concurrency and failure aggregation, and the guard's two fixtures.
  Artifact: the two harness-row predicates.
- [x] **T5** Read `scripts/check-gate-table.ts`, `scripts/check-workflows.ts`,
  and `scripts/lib/{script-discipline,script-quality}.ts` far enough to record
  what each already enforces. Artifact: the "existing predicate" column a §8 row
  cites instead of re-testing.
- [x] **T6** Create `review.md`: header, the enforcement mapping table
  (`Consumer | Anchor | Severity | Contract`), and the 52 numbered verdict rows
  (`# | Surface | Anchor | Verdict | Predicate`). Artifact: `review.md` skeleton.

## Phase 2 — Write the verdicts

- [x] **T7** The 18 §8 blocks in document order; a builder-facing block with no
  repository check is `builder-side`. Artifact: 18 verdicts.
- [x] **T8** Apply C-1, C-4, C-5, C-12, C-13 to their §8 rows; record the resolved
  predicate in the row. Artifact: five candidates resolved.
- [x] **T9** Apply C-6, C-7 (G7/G8), C-10 (G4), C-11 (G0b), C-8 (G5/G6).
  Artifact: five candidates resolved.
- [x] **T10** The 22 gate rows: one per root `check-*.ts` plus `run-gates.ts`;
  record the role header, the exit contract, the running surface, and the §8
  clause served. Artifact: 22 verdicts.
- [x] **T11** The 10 harness rows: the 8 root `test-*.ts`,
  `run-test-suite.ts`, `test-harness-guard.ts`; apply C-2 and C-9. Artifact: 10
  verdicts.
- [x] **T12** The 2 CI rows: the `gates` job and the `container` job. Artifact: 2
  verdicts.

## Phase 3 — Triage and fix

- [x] **T13** Take the full-mode prose baseline (`npm run validate:sdd`) before
  any edit, then rank every finding P0–P3 per `AGENTS.md` "Review-loop
  governance", by fix surface: prose defect → P0; demonstrated code, harness,
  manifest, or CI defect → P1; unbounded P2 → downgraded to P3. Artifact:
  severity per finding in `review.md` plus the recorded warning count.
- [x] **T14** Apply the bounded P0 §8 corrections, each re-read against the
  reference-prose bar (`scripts/validate.ts:639-654`); after the last §8 hunk run
  `npm run assemble && npm run validate:sdd` and confirm the warning count did
  not rise. Artifact: the fix hunks with their measured result.
- [x] **T15** If C-12 is a defect, correct the stale site only
  (`spec/03-build.md:742`: "(5)" → "(6)" per §9's definition at
  `spec/06-artifacts.md:16-19` and rows H10/H12 at `:55`,`:57`); never edit §9 or
  the H rows, and never edit `spec/02-requirements.md` (§5 body → P1). Artifact:
  the single-site correction or a `holds` row with the predicate.
- [x] **T16** Write register rows with one dated `### 2026-11-15 U4 verification
  workflows` heading per disposition section that receives rows, and any
  `ROADMAP.md` P1 section in the same step. Artifact: register and roadmap
  coupled under `check-registers --strict`.

## Phase 4 — Bookkeeping, AAR, gates, close

- [x] **T17** Update `worklist.md:94` with U4's exit evidence, the §8↔manifest
  vocabulary note, the `holonovel/scripts/**` boundary, and the next chunk (U5);
  amend the exit-evidence sentence (`:201-203`); update this file's checkboxes;
  edit the `ROADMAP.md` trigger to name U5. Artifact: advanced program record.
- [x] **T18** Write the `CHANGELOG.md` entry dated `2026-11-15`. Artifact: one
  dated heading with bullets.
- [x] **T19** Write `aar.md` (row count, findings by severity, dispositions,
  delta class) ending `LOOP PAUSED`, with the gate-results block a placeholder
  until T21. Artifact: `aar.md`.
- [x] **T20** Run the gates un-piped, capturing each exit code, in dependency
  order: `npm run assemble` (only if a `spec/` file changed) → `npm run
  check-registers -- --strict` → `npm run check-roadmap` → `npm run build-order`
  (only if a §5 body or §7.7 was edited) → `npm run check-fingerprint-sync` →
  `git add` the edited paths, then `npm run check-guarded-rule-change` (a
  negative confirmation: this increment touches neither Appendix M nor the
  validator patterns). Artifact: captured exit codes. A full-only gate is either
  an environment Unknown, a pre-existing baseline failure fixed as its own
  commit, or a P0 when caused by a fix hunk.
- [x] **T21** Amend `aar.md` with the measured results, run `npm run check:fast`
  un-piped to `check:fast: PASS`, then `npm run session:close` (one commit,
  because the fix set touched `spec/05-verification.md`). Artifact: the commit.
