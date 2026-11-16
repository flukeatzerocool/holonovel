# Plan — Roadmap drain 3: item 3 chunk 2 (gate-side evidence), four dispositions

**Date:** 2026-11-16 · **Kind:** planned · **Depth:** standard · **Revision:** 2
**Increment:** `docs/plans/2026-11-16-roadmap-drain-3` · **Rollback cost:** 1
**Evidence class:** repo — each premise is a command run or a `file:line` at `c5d0e73`.
Revision 2 resolves the cold pass's three blockers and two majors; task detail is in `tasks.md`.

## Questions

1. Which of the five open ROADMAP sections can move this session?
2. For item 3, what closes a share of the 99 findings without weakening the check?

## Why

**EV1 — one section is actionable.** Baseline: `check:fast` 46 passed, 0 failed, tree
clean, 136 commits unpushed; the last publish run (`.holonovel-state/publish-run.json`,
head `f447cb5`) stopped at `record`, so item 1's trigger has not fired; items 2, 5, 7
name unfired triggers (`ROADMAP.md:33`, `:60`, `:71`).

**EV2 — item 3's measured residue is 99 rows over 88 T-IDs and 84 REQs.**
`npx tsx scripts/validate.ts --write-linkage-corpus` prints `REQ evidence linkage: 99
finding(s)`; every verdict is `automated-unexercised`.

**EV3 — the predicate admits one shape of evidence.** `gatherExercisedIds`
(`scripts/validate.ts:1451-1464`) reads only the `test(...)` name under
`holonovel/scripts` (`IMPL_SCRIPTS_DIR`, `:1435`). Root tooling asserts through
`check(cond, label)` (`scripts/test-spec-tooling.ts:31`; label-first at
`scripts/test-push-pipeline.ts:37`) and through checks returning `string[]`
(`scripts/validate.ts:180`) that print a PASS/ERROR report — none admitted.

**EV4 — 38 of the 99 citations name a REQ a root gate script cites.** 26 in
`scripts/validate.ts`, 12 across 10 other `scripts/**` files (tasks.md table). The
attribution — first root script whose content matches `REQ-NNN` — is **not** proof the
script asserts the row; B2/B3 establish that per row. The other 61 name a REQ that
neither script tree mentions.

**EV5 — the residue is structural.** 49 of the 84 cited REQs appear in no script. Appendix
F asks `Automated` rows for a runnable script (`spec/appendices-reference.md:1444-1448`),
and a gate is one — but a builder-side gate reports PASS without naming a T-ID.
`INTENDED_GAP_REQS` (`scripts/validate.ts:1924-1943`) suppresses nothing here; the register
records chunk 1 of 3 (`spec/audit/review-register.md:3090-3100`).

## Item disposition

| Outcome | Items |
|---|---|
| **Chunk 2 of 3** | 3 — the 38 gate-side citations (Phases A–C). |
| **No action** | 1 — blocked on a publish, then a different model (`spec/07-independent.md:16`); 2 — needs a lens change (`holonovel/scripts/lib/holosuite-mutation.ts:103`); 5 — no `--repath` exists and no trigger fired; 7 — P3, `ArtifactKind` is three kinds (`holonovel/src/core/artifact-registry.ts:15`). |

## Decisions

- **Dec-1 — admit the shapes the gates use; keep the falsifiability rule.** A T-ID is
  evidence only in an **emitting position**: a `test(...)` name, either argument of
  `check(...)`, or a literal that is an argument to `.push(`/`console.*` or returned inside
  a `function check*(…): string[]`. Comments, data arrays (`detect-near-dupes.ts:37`),
  hint/regex sources, and literals elsewhere are not evidence. The reader is pure in
  `scripts/lib/req-checks.ts`, imported by validator and self-test, so `validate.ts`'s
  module-scope `main()` (`:2813`) never runs on import.
- **Dec-2 — a closed citation names the assertion covering the row's claim.** Per row:
  `name` (the gate asserts the claim; its report or label gains the T-ID) or `re-cite`
  (the row does not fit; the REQ body is re-cited). A file mention is neither.
- **Dec-3 — no Appendix F kind change here.** A gate evidence kind is the likely chunk-3
  answer for the 61 and the 49 script-less REQs; it is a REQ-158b change and opens chunk 3
  as a recorded decision.
- **Dec-4 — two commits, each with its gate.** `scripts` (typecheck, `test:validators`,
  `test:spec-tooling`, `validate`) then `spec/docs` (`assemble`, `check:fast`); one
  `--single` commit when the triage produced no REQ-body edit.
- **Dec-5 — the coverage register is regenerated, not hand-edited** (`exercisedIds` feeds
  it; freshness is a byte gate, `scripts/validate.ts:2154-2162`).

## Blast radius

| File | Change | Size |
|---|---|---|
| `scripts/lib/req-checks.ts`, `scripts/validate.ts` | pure reader; import; root `scripts/**/*.ts` scan; 26 report strings gain their T-ID | M |
| 10 other root `scripts/**` files (`tasks.md`) | 12 rows triaged; `test-spec-tooling.ts:404` and `test-push-pipeline.ts:154,342` already carry their T-ID | S |
| `scripts/test-req-checks.ts` | cases: each admitted shape counts; comment, unused literal, and array do not; other-ID label does not | S |
| `spec/audit/req-coverage.md` | regenerated (`validate -- --write-register`) | S |
| `spec/02-requirements.md`, `holonovel.md`, `docs/plans/…-req-evidence-linkage/corpus.md` | `re-cite` rows only; `assemble`; corpus regenerated | S |
| `spec/audit/review-register.md`, `ROADMAP.md`, `CHANGELOG.md`, `docs/plans/*` | chunk 2 of 3 with the residue split; item 3 count; entry; plan/tasks/AAR | S |

## Done bar

**Done bar:** all 38 rows carry `name`, `re-cite`, or a scheduled deferral; the corpus
reports 99 − N with N the named closures (target 38); the register and ROADMAP record the
remainder; the fast gate is green.

- Every closure names its assertion in `tasks.md`; a row with no covering assertion is
  `re-cite`, so the corpus may land above 61 and the residue states the measured number.
- Self-tests prove the three negative shapes do not count and the three admitted shapes do;
  the server-harness component of the scan is unchanged.
- `test:validators`, `test:spec-tooling`, and `validate` (0 errors) pass; the coverage
  register is regenerated, not edited.
- `check:fast` PASS at 46 gates, un-piped; `build-order` after any fingerprinted-section
  re-cite.
- ROADMAP item 3 replaces its third bullet with the measured count (the section is at the
  1–3 bullet cap); the register records chunk 2 of 3 and names chunk 3's decision.

## Phase A — Predicate

- **A1.** `scripts/lib/req-checks.ts`: pure `labelsFromContent(text)`; `scripts/validate.ts`
  imports it; root `scripts/**/*.ts` joins `exercisedIds`; server-harness path unchanged.
- **A2.** `scripts/test-req-checks.ts`: injected-text cases — `test` name, `check` label
  (both argument orders), PASS/ERROR report string; comment, unused literal, and array
  rejected; a label naming another T-ID does not evidence the cited one.

**Verify:** the negative cases fail before A1; `gatherExercisedIds` server component equal.

## Phase B — Triage and naming

- **B1.** Regenerate the corpus to a temp path; `diff` against `corpus.md` to prove 99.
- **B2.** The 26 `validate.ts` rows: find the check function that asserts the row's claim,
  name the T-ID in the report string that function's failure prints, and record function
  and line in `tasks.md`. No covering check → `re-cite`.
- **B3.** The 12 rows in 10 other files: same rule. Three close with no edit
  (`test-spec-tooling.ts:404`, `test-push-pipeline.ts:154`, `:342`); `surface-budget.ts`
  has no assertion (`fail()` at `:67` only), so its row is `re-cite` or chunk 3.
- **B4.** Apply `re-cite` edits in `spec/02-requirements.md`; `npm run assemble`; then
  `npm run build-order` if a fingerprinted section moved.

**Verify:** all 38 rows carry a verdict; three closures spot-checked against the code.

## Phase C — Measure and dispose

- **C1.** Regenerate `corpus.md` and `spec/audit/req-coverage.md`; expect 99 − N rows, all
  `automated-unexercised`.
- **C2.** `spec/audit/review-register.md`: chunk 2 of 3, residue split "gate exists,
  unasserted" / "no script cites the REQ", chunk 3 opens on Dec-3.
- **C3.** `ROADMAP.md` item 3: rewrite the count bullet (`:38-45`) with the measured number
  and split, leave the conformance pointer (`:46-49`); items 1, 2, 5, 7 untouched.

**Verify:** `check-registers`; `check-roadmap`; `validate` 0 errors.

## Phase D — Close

- **D1.** `aar.md`: five-item dispositions, 38-row outcome, measurements, `## Changelog entry`.
- **D2.** `npm run session:close` per Dec-4. **Verify:** `check-loop-artifacts`; fast PASS.

## Risks and rollback

- **R1 — a named report string is theater.** Dec-2 requires the claim match; B2 records
  function and row. **R2 — the scan change reddens a self-test.** A2 pins each shape.
  **R3 — a re-cite makes the delta Minor.** The pipeline scaffolds the record. **R4 — the
  register gate reddens.** C1 regenerates it. **Rollback:** every step is a file edit;
  both generated files rebuild from the tree.

## Open questions

- Item 1 needs an operator choice: which model verifies and the clean-directory handoff
  (§10 steps 1–4). It stays scheduled and fires on the next publish.
