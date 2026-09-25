# Proofread Register — 2026-09-25

The tracking surface for the in-depth spec proofread. Each entry carries a
terminal disposition: `Fixed`, `Accepted`, `Open`, or `Deferred`. The baseline
and every batch are recorded here; the AAR references this file rather than
restating it. Warning counts are produced by `npm run validate:sdd` (the
proofreading pass in `scripts/validate.ts`).

## Baseline (2026-09-25, before this program)

`npm run validate:sdd` → **0 errors, 52 warnings**.

The proofreading pass scores two surfaces only: REQ bodies (per-REQ
heuristics) and narrative prose from the reading guide through §4
(`extractNarrativeProse`, `scripts/lib/parse-spec.ts:98`). Appendices and the
§5 preamble, §6, §7, §8, §9, §10, and §11 prose are not scored — the coverage
gap this program closes.

## Warning inventory (52)

| Family | Count | Locations | Trigger |
| --- | --- | --- | --- |
| Passive voice | 11 | REQ-452, 247b1, 467, 478, 484, 486, 490, 493, 502, 514, 517 | >40% of a REQ's sentences match `be + past participle` |
| Modal drift | 4 | REQ-162b, 208a, 244b, 383a | REQ uses SHALL alongside lowercase must/will/should |
| Sentence length | 4 | REQ-207a (49w), 321d (78w), 092a (48w), 452 (all >30w) | Sentence >45 words, or all sentences >30 words |
| Condition stacking | 3 | REQ-452, 466, 523 | >3 conjunctions or >2 conditionals in one sentence |
| REQ-body readability | 28 | 130a, 092a, 321d, 452, and M/N series 456, 463, 465–467, 469–470, 473–477, 481–482, 484, 486, 490, 493, 498, 502, 504, 507, 510, 540 | Flesch-Kincaid grade >18 (backtick identifiers stripped) |
| Narrative-prose readability | 2 | Reading guide (line 93); §1 "Executed-in-context boundaries" (line 177) | FK grade >12 on §1–§4 prose |

88 warning lines map to 52 warnings across 38 distinct REQs and 2 paragraphs;
several REQs trip multiple families (REQ-452 trips four).

## Accepted exceptions

Recorded acceptances under the spec's own policy (§5.13 readability standard;
Appendix M authoring conventions): vocabulary, canonical terms, and SHALL/MAY
strength outrank prose heuristics. After Batch 3 the tree carries **133
warnings, all accepted** (0 errors). Line numbers below are against the
assembled spec at the batch-3 commit.

- **Modal drift (4).** REQ-162b, REQ-208a, REQ-244b, REQ-383a — the lowercase
  "must" carries the convergence-metric name; renaming it degrades the metric
  contract. Previously recorded DP-3 non-actionable.
- **EARS-inherent passive voice (9).** REQ-467, 478, 484, 486, 490, 493, 502,
  514, 517 — single-sentence `SHALL be <verb>ed` bodies materializing engine
  state; converting to active would name a new actor and risk the contract.
- **Sentence length (2).** REQ-207a (49w) and REQ-321d (78w) are label-bound
  enumerations: REQ-207a's `(a)–(c)` labels are cited by REQ-207b, and
  REQ-321d's dispatch list cannot split without exceeding Appendix M's
  eight-sentence limit.
- **REQ-body readability (25).** The M/N-series REQs (455–545) plus 130a,
  321d, 466, 467 and others are dense technical enumerations; rewriting to
  grade ≤18 would drop load-bearing terms.
- **Reference-prose readability (47).** Appendix, §5-preamble, and §6–§11
  paragraphs above grade 18. The `extractReferenceProse` harness uses the same
  grade-18 normative ceiling as REQ bodies. Listed below; W.4's grade 60.4 is a
  metric artifact on a token-dense enumeration, not a readability defect.
- **Reference-prose sentence length (39).** Build-process and appendix
  paragraphs with a sentence over 45 words — largely procedural enumerations and
  semicolon lists. Structural clarity pointers, accepted as a backlog; split on
  future edits to those sections.
- **Narrative-prose readability (2).** The reading guide (line 93) and §1
  "Executed-in-context boundaries" (line 177) carry mandated vocabulary
  (`Spec Kit`, `executable-spec`, `client-side subagent splitting`); no
  meaning-preserving rewrite clears grade 12.

### Reference-prose readability exceptions (47)

| Section (line) | Grade |
| --- | --- |
| 5.2 (673) | 18.7 |
| 5.10 (3351) | 21.8 |
| 5.10 (3409) | 24.8 |
| 5.12 (3681) | 18.8 |
| 5.12 (3689) | 18.4 |
| 6.3 (4673) | 21.3 |
| 6.3 (4722) | 23.9 |
| 6.3 (4739) | 21.0 |
| 6.3 (4746) | 18.2 |
| 6.3 (4770) | 27.9 |
| 6.3 (4801) | 18.5 |
| 6.3 (4811) | 20.1 |
| 6.5 (5136) | 18.9 |
| 6.5 (5175) | 22.6 |
| 6.5.3 (5253) | 18.5 |
| 6.5.4 (5279) | 23.5 |
| 6.5.5 (5299) | 19.8 |
| 6.5.5 (5310) | 19.1 |
| 6.5.5 (5322) | 19.4 |
| 6.5.5 (5339) | 20.2 |
| 6.6 (5444) | 18.1 |
| Surface-to-scenario (6060) | 18.0 |
| Holonovel Pattern Buffer (6110) | 18.5 |
| Implementation fingerprint (6396) | 18.3 |
| Synthesis consistency (6449) | 18.4 |
| Synthesis population (6464) | 19.0 |
| 7.7.0 (6819) | 21.2 |
| 7.7.0 (6842) | 23.4 |
| 8 (7107) | 20.1 |
| 8 (7214) | 19.5 |
| 10 (7398) | 19.4 |
| 11.1 (7555) | 19.3 |
| 11.3 (7703) | 18.9 |
| 11.3 (7740) | 19.6 |
| 11.4 (7906) | 25.9 |
| G.2 (10272) | 20.4 |
| G.6 (10376) | 18.5 |
| Indexing and badge gating (10617) | 21.2 |
| Appendix M (10700) | 26.3 |
| Appendix N (10850) | 21.7 |
| Appendix P (11298) | 18.7 |
| Appendix S (11449) | 19.0 |
| V.4 (11665) | 21.2 |
| V.7 (11701) | 24.9 |
| V.8 (11724) | 24.9 |
| W.4 (11956) | 60.4 |
| Y.2 (12113) | 27.3 |

### Reference-prose sentence-length exceptions (39)

| Section (line) | Max words |
| --- | --- |
| 5.10 (3409) | 56 |
| 5.12 (3681) | 51 |
| 6.3 (4654) | 63 |
| 6.3 (4673) | 64 |
| 6.3 (4722) | 72 |
| 6.3 (4755) | 55 |
| 6.3 (4770) | 52 |
| 6.3 (4824) | 47 |
| 6.5 (5007) | 59 |
| 6.5 (5049) | 60 |
| 6.5 (5136) | 59 |
| 6.5 (5175) | 81 |
| 6.5.3 (5233) | 69 |
| 6.5.4 (5279) | 52 |
| 6.5.5 (5322) | 62 |
| 6.6 (5362) | 53 |
| 6.6 (5393) | 62 |
| 6.6 (5444) | 58 |
| Surface-to-scenario (5774) | 49 |
| Surface-to-scenario (6041) | 54 |
| Surface-to-scenario (6060) | 49 |
| Holonovel Pattern Buffer (6110) | 52 |
| Gap audit method (6416) | 52 |
| Synthesis consistency (6449) | 59 |
| Synthesis population (6464) | 67 |
| 7.7.0 (6779) | 49 |
| 7.7.0 (6842) | 54 |
| 8 (7135) | 49 |
| 8 (7145) | 46 |
| 8 (7214) | 71 |
| 8 (7232) | 57 |
| 11.1 (7555) | 55 |
| 11.3 (7710) | 72 |
| B.5 (8268) | 47 |
| Appendix L (10631) | 51 |
| Appendix M (10776) | 50 |
| Appendix M (10807) | 48 |
| W.4 (11956) | 148 |
| Y.2 (12113) | 56 |

### Reference-prose condition-stacking exceptions (5)

| Section (line) | Finding |
| --- | --- |
| 6.3 (4770) | 4 conjunctions, 0 conditionals |
| 6.5 (5007) | 4 conjunctions, 1 conditional |
| 7.7.0 (6779) | 4 conjunctions, 0 conditionals |
| 11.3 (7710) | 1 conjunction, 3 conditionals |
| G.6 (10383) | 4 conjunctions, 0 conditionals |

## Finding ledger

| ID | Location | Finding | Disposition |
| --- | --- | --- | --- |
| PR-1 | `spec/01-foundations.md:207` | "Pattern Buffer-5" is a dangling reference (relic of the 2026-08-10 Gauntlet→Pattern Buffer rename); no sub-workflow by that number exists. | Fixed — generalized to "§6.6 Pattern Buffer" (intent unrecoverable). |
| PR-2 | `spec/05-verification.md:74`; `appendices-reference.md:2653, 2848, 2868` | `_Verify:_` citation marker inconsistent with canonical `_Check:_`. | Fixed — normalized to `_Check:_`. |
| PR-3 | This program | Appendices and §5 preamble/§6/§7/§9–§11 prose are outside the proofreading pass. | Fixed — coverage extended (`referenceProse` category). |
| PR-4 | `spec/02-requirements.md` | Ten warnings cleared by rewrites (REQ-452, 092a, 466, 523, 247b1). | Fixed. |
| PR-5 | `spec/01a-constitution.md:89` | Garbled "State drift" definition: "the GM has narrated … advances beyond" (missing relative clause). | Fixed — "the GM's narration … has advanced beyond". |
| PR-6 | `spec/appendices-reference.md` (Appendix M) | Reference-prose checks were unscored; the exception-location policy was unstated. | Fixed — added the reference-prose standard and the register/DECISIONS.md split. |

## Batch log

- **Batch 1 (2026-09-25, commit a0fa83d).** `01-foundations.md` (reading guide
  + §1–§3), `03-build.md` §6.1–§6.2 preamble, `04-runtime.md` lines 1–459,
  `05-verification.md`, `06-artifacts.md`, `07-independent.md`. Three objective
  fixes (two missing copulas, one missing serial "and"). Gates green; warnings
  unchanged at 52.
- **Batch 2 (2026-09-25).** Created this register; fixed PR-1 (dangling
  "Pattern Buffer-5" generalized to §6.6) and PR-2 (four `_Verify:_` →
  `_Check:_`); extended the proofreading pass to reference prose via
  `extractReferenceProse` (`referenceProse` category, grade-18 ceiling);
  rewrote five REQs (452, 092a, 466, 523, 247b1) clearing ten warnings. Base
  warnings 52 → 42; the reference-prose harness surfaced 47 more; total
  0 errors / 89 warnings, all accepted. Added Appendix V.9. Validator
  self-tests 13/13. Bounded coverage batch: `01a-constitution.md` (one garbled
  definition fixed, PR-5), `appendices-licenses.md`, and `08-synthesis.md` §11.1–§11.2
  read clean.
- **Batch 3 (2026-09-25).** Extended the reference-prose pass with sentence-length
  and condition-stacking checks (passive voice deliberately excluded); recorded
  the 44 new structural findings as accepted backlog; added the Appendix M
  reference-prose standard and exception-location note (PR-6); bounded coverage
  read of `04-runtime.md` §7.7.1a–§7.8 and the fixture-intro prose, both clean.
  Total 0 errors / 133 warnings, all accepted. Validator self-tests 13/13.

