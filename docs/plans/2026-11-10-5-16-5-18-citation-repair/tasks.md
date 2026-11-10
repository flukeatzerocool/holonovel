# Tasks — §5.16–§5.18 citation repair (F-P6b-21)

Status: in progress · Increment: `docs/plans/2026-11-10-5-16-5-18-citation-repair/`

## Task 4.0 — preflight disposition table

One row per REQ named by the roadmap bullet: `cited → carrier → action`.

| REQ | Cited | Carrier found at HEAD | Contract exercised? | Action |
|---|---|---|---|---|
| REQ-379c | T440 | `test-ruleset-surface-remediation.ts:173` | yes — ruleset annotations + prefix map | keep |
| REQ-381c | T442 | `:225` | yes — cross-ruleset gating and `inapplicable` hints | keep |
| REQ-383b | T444 | `:252` | yes — per-ruleset health + Player filter | keep |
| REQ-384c | T445 | `:332` | yes — switch changes scope, both endpoints audited | keep |
| REQ-385b | T446 | `:292` | yes — prefixed suggest tools per ruleset | keep |
| REQ-386b | T447 | `:352` | yes — export names ruleset, imports validate | keep |
| REQ-387b | T431 | T431 = Pattern Buffer (`appendices-reference.md:1886`); T448 `:373` is the codex axis | no | **re-point → T448** |
| REQ-389b | T452 | `test-output-contracts.ts:1689` | yes — corrupted manifest rejected by slug, hashes named | keep |
| REQ-389c | T453 | `test-output-contracts.ts:1590,1605` | yes — install/remove/list + binding refusal | keep |
| REQ-391b | T457 | no T457 title; mechanism is T720 `test-selection.ts:204` | schema half only | **re-point (T457 token on T720); tool-set half → F-P6b-28** |
| REQ-391c | T458 | `test-ruleset-surface-remediation.ts:196` | yes — pagination + cursor resume | keep |
| REQ-393 | T460 | `test-output-contracts.ts:1791` asserted `typeof rulesets_hydrated`; T498 `test-fingerprints.ts:182` asserts the incompatible branch | no (numeric only) | **write T460 in `test-fingerprints.ts`; cite T498** |
| REQ-439 | T525 | `test-ironsworn.ts:100,107` | yes — dice, band, seed reproduction | keep |
| REQ-395a | T463, T650 | `test-fingerprints.ts:275,298` | yes — usage/rejection, supplement idempotence | keep |
| REQ-395b | T464 | no T464 title anywhere; §0 + Appendix V exist (`01-foundations.md:87`, `appendices-runbooks.md:13,51,70,85`) | no | **write T464 in `test-spec-tooling.ts`** |
| REQ-398 | T467 | no T467 title; T462 `test-update-workflow.ts:292` (separate `--server-dir`), T491 `test-push-pipeline.ts:282,307` | halves only | **write T467 tokens on the two pipeline checks; cite T462, T491** |
| REQ-419 | T492 | no T492 title; `classifyDelta` + `hasEditorialDisposition` exist and are unit-checked at `test-spec-tooling.ts:93-98` | no (and ordering hole) | **write T492; fix `classifyDelta` order** |
| REQ-557 | T650 | `test-fingerprints.ts:298` | yes — idempotence + base drift | keep |
| REQ-563 | T656 | `test-ruleset-gates.ts:328` | yes — byte-identical re-emission | keep |
| REQ-564 | T657 | `test-fingerprints.ts:326` | yes — defect rebuilt through emitter | keep |

Adjacent gaps recorded, not fixed: REQ-392 → T459 (F-P6b-27), REQ-391b tool-set
clause (F-P6b-28).

## Task 4.1 — §5.16/§5.17 residual citations

- [x] REQ-387b `_Check:_` T431 → T448 (`spec/02-requirements.md:3919`)
- [x] T448 row REQ column → `REQ-387, REQ-387b` (`spec/appendices-reference.md:1903`)
- [x] T457 token added to T720's title (`holonovel/scripts/test-selection.ts:204`, header `:10-11`)
- [x] T457 row rewritten to the schema-disclosure contract (`appendices-reference.md:1912`)
- [x] T460 assertion written in `test-fingerprints.ts:247`; T498 row gains REQ-393
- [x] T460 token dropped from `test-output-contracts.ts:1791`; error string declaims REQ-393
- [x] REQ-393 `_Check:_` → `T460, T498` (`spec/02-requirements.md:3961`)

## Task 4.2 — §5.18 residual citations

- [x] T464 block written (`scripts/test-spec-tooling.ts:361-378`); 14 checks green on first run
- [x] T467 tokens on the pipeline deploy checks (`scripts/test-push-pipeline.ts:144,307`)
- [x] T467 row rewritten (`appendices-reference.md:1483`); T462 row gains REQ-398; T491 row gains REQ-398
- [x] REQ-398 `_Check:_` → `T467, T462, T491` (`spec/02-requirements.md:3990`)
- [x] `hasEditorialDisposition` moved into `scripts/lib/spec-delta-classify.ts:55`, imported by `spec-delta.ts`
- [x] `classifyDelta` consults the major triggers before returning `editorial` (`:46`)
- [x] T492 four cases written (`scripts/test-spec-tooling.ts:100-121`)
- [x] T492 row rewritten (`appendices-reference.md:1508`); REQ-419 `_Check:_` → `T492, G2`
- [x] Red demonstrated by diffing the pre-change classifier (`git show HEAD:…` → `editorial`; now `major`)

## Task 4.3 — close-out

- [x] F-P6b-21 `Resolved` with predicates (`spec/audit/review-register.md:14-53`)
- [x] F-P6b-27 and F-P6b-28 opened under `Scheduled-roadmap`
- [x] Roadmap section retired; `§5.16–§5.17 capability citation gaps (P1)` opened
- [x] `spec/audit/req-coverage.md` regenerated — REQ-391 gains T457, REQ-393 gains T498, REQ-398 gains T462; no bucket moves
- [x] CHANGELOG bullet group under the existing `2026-11-10` heading
- [ ] `build-order` + `check:fast` + `session:close`
