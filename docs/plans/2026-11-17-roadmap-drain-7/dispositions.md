# Dispositions — REQ evidence linkage chunk 6 (the class (c) block, 15 rows)

P1 triage of the 15 class (c) rows. Schema per plan D4: `cite` names the in-repo-checkable
clause and `home` its asserting site for an `author` row; both are `—` for a `closed` row, whose
asserting site is the `DECISIONS.md` procedure bullet.

| REQ | T-ID | class | cite | home | action |
|---|---|---|---|---|---|
| REQ-013 | T25 | (c) | — | — | closed |
| REQ-013 | T36 | (c) | — | — | closed |
| REQ-014 | T21 | (c) | — | — | closed |
| REQ-123 | T130 | (c) | — | — | closed |
| REQ-209 | T252 | (c) | — | — | closed |
| REQ-270 | T290 | (c) | — | — | closed |
| REQ-272 | T292 | (c) | — | — | closed |
| REQ-274 | T294 | (c) | — | — | closed |
| REQ-275 | T295 | (c) | — | — | closed |
| REQ-299 | T343 | (c) | — | — | closed |
| REQ-299 | T430 | (c) | — | — | closed |
| REQ-300 | T344 | (c) | — | — | closed |
| REQ-301 | T345 | (c) | — | — | closed |
| REQ-303 | T347 | (c) | — | — | closed |
| REQ-354 | T405 | (c) | — | — | closed |

Class at triage: (c) 15 = 15. After closure: 15 rows `closed`, residue `57 + 0` = 57 (all
class (b)). `n = 0`.

## Why no row took `author`

The D4 burden is on the flip: a row takes `author` only when an in-repo-checkable clause exists.
Three rows were EV9's candidates; each was refuted on evidence, not on judgement alone.

- **The spec already classifies all 13 REQs as builder/verifier-side.** `spec/audit/req-coverage.md`
  places every one of them in bucket **E** — "intended gap (builder/verifier-side, exempt from
  strict)" — including REQ-300, REQ-301, and REQ-303. A bucket-E requirement binds the builder or
  the verifier, not the reference adapter, so a builder/verifier drill is its correct evidence
  class.
- **T344 (REQ-300) names a record this repository does not produce.** REQ-300 requires a
  diagnostic record in `DECISIONS.md` (5) with a `resolution` field moving `pending` → `converged`.
  Neither `resolution.*converged` nor a diagnostic-record producer exists in `holonovel/src` or
  `holonovel/scripts`.
- **T345 (REQ-301) names an aggregate this repository does not produce.** `convergence_summary`
  does not occur anywhere in `holonovel/src`, `holonovel/scripts`, or `scripts`.
- **T347 (REQ-303) is scoped per section; the harness skips per ruleset hash.**
  `holonovel/scripts/run_ruleset_pattern_buffer.ts:216` emits
  `skipped — ruleset hash unchanged (§6.6 convergence-loop scoping)` and its summary counts
  `skipped` separately (`:770`), but the T347 drill is an incremental extraction where 2 of 5
  sections changed. No per-section scoping or `[validated-by-prior-build]` disposition exists, so
  a harness assertion would test the whole-hash skip — a different contract.
- **T405 (REQ-354) needs both an unimplemented annotation and a content fixture.** `component_type`
  occurs nowhere in `holonovel/src` or `holonovel/scripts`, and the drill needs a ruleset with GM
  advice chapters.
- **The remaining eleven need builder-produced artifacts.** `RULESET_MODEL.md` /
  `ruleset_model.json` (T252), the four handoff documents (T290), the build register's sections
  (1), (4), (5) at build time (T21, T36, T292), an operator-sized ruleset above 200 indexed items
  (T343), and the verifier's Phase-2 comparison (T294, T295, T430). `git ls-files | grep -iE
  'RULESET_MODEL|ruleset_model\.json'` returns nothing.

## Clause coverage (the procedure each closed row now carries)

| T-ID | Clause the operator checks | Appendix F row |
|---|---|---|
| T21 | sources byte-identical to the intake hash in the build register (1) | `spec/appendices-reference.md:1464` |
| T25 | deletion drills: absent section produces no tool, waiver logged | `:1466` |
| T36 | build register (1) edition/title, (5) every hardcoded table with waiver | `:1475` |
| T130 | NPC stat fields derived from the ruleset, all optional but `name` | `:1642` |
| T252 | `RULESET_MODEL.md` / `ruleset_model.json` agree on four fields | `:1727` |
| T290 | handoff artifacts carry the spec-version comment matching `spec_health` | `:1780` |
| T292 | build register (4) `stock_elements` catalog, reused on unchanged hash | `:1782` |
| T294 | verifier confidence score arithmetic (0.70 / 0.84 / 1.0) | `:1784` |
| T295 | evidence hash commitment, tamper classification, Phase-2 block | `:1785` |
| T343 | adjusted confidence threshold above 200 indexed items, survives convergence | `:1818` |
| T344 | G2 diagnostic record with `resolution` moving to `converged` | `:1819` |
| T345 | per-iteration audit trail and `convergence_summary` | `:1820` |
| T347 | per-section skip annotations, cross-section full runs, split summary | `:1822` |
| T405 | `supplementary_guidance` items carry `component_type` | `:1875` |
| T430 | cross-model audit covers ≥2 archetype categories with findings | `:1900` |

Two rows are arithmetic/structural (T294, T295) and still require the verifier's own Phase-2 run:
the operator holds the comparison record, not the repository.
