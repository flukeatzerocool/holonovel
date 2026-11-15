# Tasks — U3: runtime conventions and the engine contract remainder

Dependency-ordered breakdown of `plan.md`. Task IDs mirror the plan's numbered
steps one-for-one (T1–T20), so the AAR can cite either form. Each task names the
artifact it leaves behind.

## Phase 1 — Build the mapping, then read

- [x] **T1** Read the two §7 predicates once — `checkCouplingCompleteness`
  (`scripts/validate.ts:1049-1206`) and `checkConfigCouplingAnnotations`
  (`:1273-1330`) — plus the archetype set at `:1051`. Stop once severity is
  settled. Artifact: mapping table rows with a severity per predicate.
- [x] **T2** Read the six gate consumers — `action-conflicts`,
  `check-tool-surface`, `surface-budget`, `surface-replay`,
  `tool-citation-check`, `check:conformance`
  (`scripts/lib/gate-manifest.ts:177-265`) — far enough to record their
  contract. Do not read the harnesses. Artifact: one contract line per gate.
- [x] **T3** Read `scripts/lib/contract-fingerprint.ts:37-43` and
  `scripts/assemble.ts:48-60`. Artifact: the fingerprint/assembly boundary that
  settles `D4`.
- [x] **T4** Read `holonovel/src/engine.ts` (19 lines), `holonovel/src/library.ts`
  and `holonovel/package.json:34-52`. Artifact: the library split facts that
  settle C-9 and C-10.
- [x] **T5** Create `review.md`: header, mapping table, 28 numbered rows with
  surface and anchor. Artifact: `review.md` skeleton.

## Phase 2 — Write the verdicts

- [x] **T6** The 10 `###` headings in §7.1–§7.9 **excluding §7.7**, whose four
  sub-block rows T8 owns. Artifact: 10 verdicts (`builder-side` decided by
  `D1`).
- [x] **T7** Apply C-1 through C-6 to the §7 rows. Artifact: six candidates
  resolved to `holds` or a finding inside their rows.
- [x] **T8** §7.7 rows (4 of the 14): archetype vocabulary on the property table,
  a **manual** Source/Target comparison for the pattern-rule table (C-13), the
  pattern-rule set against the coupling parse (C-1), coupling tokens through the
  existing resolver (C-12). Artifact: 4 verdicts.
- [x] **T9** Engine-contract rows (6), with §2–§6 recorded as
  `already-reviewed:P5`. Resolve the appendix's 13 clause rows (C-11) and apply
  C-8/C-9/C-10. Artifact: 6 verdicts; every appendix row resolved.
- [x] **T10** Code rows (8): `core/server.ts`, `rulesets.ts`,
  `tool-registry.ts`, `surface-report.ts`, `core/surface-projection.ts`,
  `world/index.ts`+`model.ts`, `world/parser.ts`, `index.ts` dispatch wrapper.
  Artifact: 8 verdicts with the line pair for any finding.
- [x] **T11** Resolve C-7 (integrity hashes) inside the §7.9 row and C-5
  (decision queue) inside the `index.ts` row; record the `index.ts` body and
  `world/*` §5.9/§5.10 seams as prose below the mapping table.
  Artifact: candidates complete, no "unverified" left.

## Phase 3 — Triage and fix

- [x] **T12** Rank every finding P0–P3 per `AGENTS.md` "Review-loop governance",
  by fix surface: prose defect → P0; demonstrated code defect → P1; unbounded P2
  → downgraded to P3. Artifact: severity per finding in `review.md`.
- [x] **T13** Apply the bounded P0 prose corrections, each re-read against the
  reference-prose bar (`scripts/validate.ts:639-654` — grade 18, no 45-word
  sentence, no stacked conditions). Artifact: the fix hunks; after the last §7
  hunk, `npm run assemble && npm run validate:sdd` (the same pass as the EV16
  baseline: 0 errors, 296 warnings) stays green.
- [x] **T14** If C-1 is a defect, correct all **seven** sites atomically
  (`spec/04-runtime.md:648`, `spec/01a-constitution.md:116`,
  `spec/02-requirements.md:3811,3816`, `spec/appendices-reference.md:1880,1881,1894`)
  or none; flag the §7.7/§5 hit for `build-order` at T19 and do not run it here.
  Artifact: the atomic fix set or a `holds` row with the predicate.
- [x] **T15** Write register rows with one dated `### 2026-11-14 U3 runtime
  conventions` heading **per disposition section that receives rows**, and any
  `ROADMAP.md` P1 section in the same step. Artifact: register and roadmap
  coupled under `check-registers --strict`.

## Phase 4 — Bookkeeping, AAR, gates, close

- [x] **T16** Update `worklist.md:93` with U3's exit evidence, the `index.ts`
  boundary note, the `builder-side` interpretation, and the next chunk (U4);
  amend the chunk boundary sentence (`:167-168`) to record that a P0 prose
  defect is fixed in this increment; update this file's checkboxes; edit the
  `ROADMAP.md` trigger to name U4. Artifact: advanced program record.
- [x] **T17** Write the `CHANGELOG.md` entry dated `2026-11-14`. Artifact: one
  dated heading with bullets.
- [x] **T18** Write `aar.md` (row count, findings by severity, dispositions,
  delta class) ending `LOOP PAUSED`, with the gate-results block a placeholder
  until T20. Artifact: `aar.md`.
- [x] **T19** Run the gates un-piped, capturing each exit code, in dependency
  order: `npm run assemble` (only if a `spec/` file changed) → `npm run
  check-registers -- --strict` → `npm run check-roadmap` → `npm run build-order`
  (conditional, `D4`) → `npm run check-fingerprint-sync` → `git add` the edited
  paths, then `npm run check-guarded-rule-change` (a negative confirmation: this
  increment touches neither Appendix M nor the validator patterns). Artifact:
  captured exit codes. If `build-order` ran, a full-only gate
  (`check-container-image`, `playability`, `test:pipeline`) is either an
  environment Unknown, a pre-existing baseline failure fixed as its own commit,
  or a P0 when caused by a fix hunk; if `build-order` was skipped, none ran.
- [x] **T20** Amend `aar.md` with the measured results, run `npm run check:fast`
  un-piped to `check:fast: PASS`, then `npm run session:close` (which owns the
  commit split: one commit for a `spec/`-touching fix set, a by-concern split
  for a docs-only increment). Artifact: the commit.
