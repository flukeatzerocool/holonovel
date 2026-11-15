# AAR — U5: artifacts, independent verification, cadence, publication

## What was supposed to happen

Execute Phase 1 of the roadmap-closure program: review §9, §10, Appendix V, and
the publication surface as 46 verdict rows, disposition every finding, fix the
bounded prose defects, and close with the gates green. Done bar: 46 rows, one
terminal disposition per finding, `worklist.md` in exit-evidence form, and
`assemble`, `check:fast`, `test:pipeline`, `check-registers`, `check-roadmap`,
`check-fingerprint-sync` all exiting 0 un-piped.

## What happened

1. **Phase 0.** Baseline `check:fast` was 45/45 green on a clean tree. The
   re-measurement trigger was evaluated: 11 commits after the baseline window,
   against a 26-commit threshold, so the loop-gate item stays open. The first
   measurement used `--since=2026-11-15`, which git parses as UTC midnight and
   which returned zero on this offset; the corrected count is amendment A-2.
2. **Rows.** All 46 settled, including an amendment (A-3) widening R25 to cover
   Appendix V's lead-in, which the budget had left unassigned.
3. **Nine defects, all fixed** — seven prose predicates in `spec/` and `docs/`,
   one stale generated snapshot, and one incomplete layout description. Details
   and predicates are in `review.md` and in the register's
   `## Resolved — 2026-11-15 U5 artifacts and publication`.
4. **Generated artifact corrected.** `check-g7-attestation` failed after the spec
   edits: the generated module's `SPEC_HASH` covers the whole assembled spec, so
   every spec edit invalidates it. Regenerated; diff is one line. Recorded as
   amendment A-1 because the plan had claimed no generated artifact would move.

## Evidence

| Claim | Command → result |
|---|---|
| Baseline | `npm run check:fast` → 45 passed, 0 failed, `check:fast: PASS` |
| Spec assembles | `npm run assemble` → both copies written, build-phase-map hash updated |
| Lint | `npm run lint` → exit 0 |
| Validation | `npm run validate` → 0 errors, 296 warnings (baseline 296) |
| G7 attestation current | `npx tsx holonovel/scripts/generate-g7-attestation.ts` → 84 bodies, 31/31 parents; `--check` green after |
| Snapshot current | `npm run loop-audit -- --write` → as of `6f950d3`, 808 commits, 95 increments |
| Rows complete | `grep -c '^\| R[0-9]' review.md` → 46 |
| Close gate | `npm run check:fast` → see the close record below |

## Findings and dispositions

- **U5-F1 … F7, F9 — prose predicates.** Fixed in the increment; each entry in
  the register cites the `file:line` that carried it. Terminal: fixed.
- **U5-F8 — the loop-audit snapshot was 15 days stale.** Regenerated. The
  `--check` thresholds passed while the snapshot was stale, which is why no gate
  caught it: `--check` recomputes live and compares thresholds, not bytes. That
  division is deliberate (`scripts/loop-audit.ts:1-13`); the staleness is a
  cadence observation, not a gate defect. Terminal: fixed.
- **A-1 — the G7 attestation is keyed on the whole spec.** Fixed by
  regeneration; the plan's "no generated artifact moves" assumption was wrong and
  is recorded as an execution amendment. Terminal: fixed.
- **A-2 — the trigger count was measured with a query that cannot match.** The
  conclusion (unmet) held; the number did not. Terminal: fixed by the corrected
  measurement recorded here and in `plan.md`.
- **A-3 — Appendix V's lead-in was outside the row budget.** R25 widened; the
  row count stayed 46 because the lead-in attaches to the first runbook.
  Terminal: fixed.

No finding required a scheduled roadmap entry: every defect was prose or a
deterministic regeneration, which is the class the plan bounded this increment to.

## Conditions carried from plan review

- **C-1 — the register heading line numbers were not spot-checked by a cold
  pass.** Resolved: the entry now cites `spec/audit/review-register.md` by
  heading, and `check-registers` passes.
- **C-2 — `holonovel/testdata` tracked-vs-ignored is contested.** Not U5's
  surface; it stays pre-identified for U6 in `plan.md` Phase 2.

## Done bar

Met: 46 rows; every finding dispositioned; `worklist.md:95` in exit-evidence
form; `assemble`, `check:fast`, `test:pipeline`, `check-registers`,
`check-roadmap`, and `check-fingerprint-sync` green; no existing ROADMAP section
removed; no fingerprint-bearing section, server source, or publish action
touched apart from the generated attestation's spec hash.

## Loop

LOOP PAUSED
