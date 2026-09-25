# Spec↔Code Conformance Comparison — 2026-09-25

**Scope:** all 498 base REQs (1,138 REQ blocks including sub-parts) in the
assembled spec, versus the `holonovel` server implementation
(`holonovel/src`, `holonovel/scripts`) and the build/verifier tooling
(`scripts/`, gates).

**Method.** A new informational tool, `scripts/compare-spec-code.ts`, joins the
assembled spec's REQ bodies, the committed coverage register
(`spec/audit/req-coverage.md`), the server source's REQ citation sites, the
Appendix F test map, the §6.6 sub-workflow map, and the harness
`test("<name>")` bodies into a per-REQ dossier. Three evidence layers were
applied:

1. **Mechanical** — bucket classification, citation sites, comment-only
   citations, sub-part rollup (all 498 REQs).
2. **Executable** — `holonovel/npm run test:all` (31 harnesses), zero failures.
3. **Semantic** — contract-vs-code and contract-vs-test reading of the flagged
   risk pools (109 comment-only-cited REQs, 103 test-title-divergence
   candidates, 182 orphan-test-id candidates), with full-file escalation for
   `Missing`/`Drift` candidates.

**Verdict counts.** A (gap) 0 · B (review) 0 · C (evidenced) 386 · D 0 ·
E (intended gap) 112. Source-cited 446 IDs; 463 exercised test IDs; all 31
harnesses green. Every bucket-C REQ has at least one code citation and at least
one exercised ID.

## Overall assessment

The implementation is broadly conformant and its executable suite is green.
The dominant finding is **not** missing functionality but a
**coverage-integrity defect**: the validator's bucket-C test treats any `T`/`S`
ID appearing in a harness `test("…")` name as exercised evidence. Harness test
names bundle many IDs — one conflict-lifecycle test name carries ten
(`T25/T47/T56/T90/T91/T110/T131/T161/T162/T043`) while asserting only REQ-043 —
so REQs whose Appendix F test definitions are *not actually implemented* still
classify as bucket C. Five confirmed REQs have false C evidence; the systemic
cause (SC-6) applies to the whole bundled-ID class.

**Status:** ✅ RESOLVED 2026-09-25 — comparison complete; all confirmed findings
fixed or dispositioned (see Execution outcome).

## Critical findings (P0)

None. No demonstrated wrong output and no gate failure; `test:all` is green and
`check:fast` passes.

## Major findings (P1)

| ID | REQ | Finding | Evidence |
|----|-----|---------|----------|
| SC-1 | REQ-113 Result count reporting | Bucket C is false. The REQ is implemented (`countReport`, `holonovel/src/index.ts:1024-1029`; used at `:762-764`) but **no executed test exercises it**. Appendix F defines T116 as "Result count reporting: … assert returned count of 1 and total count of 3"; T116's only harness occurrence is the unrelated redo test. | `holonovel/scripts/test-backfill.ts:313` `test("T121/T116: redo restores prior state")`; `rg "of .* results"` → none |
| SC-2 | REQ-124 NPC damage resolution | Bucket C is false. T131's only harness occurrence is the bundled conflict-lifecycle test, which asserts no damage resolution; no damage-resolution test exists in any harness. | `holonovel/scripts/test-backfill.ts:295`; no `damage` assertion outside ruleset fixtures |
| SC-3 | REQ-134 Minimum Player tool surface | T148 (Appendix F: per-group Player invocation + GM-exclusivity) is absent from every harness; the only "exercised" evidence is S6, whose test is single-user connection (REQ-030). | `rg "T148" holonovel/scripts/` → none; `S6/S17/REQ-030` |
| SC-4 | REQ-135 Badge briefing size budget | T149 (Appendix F: small-budget truncation order, never-truncated elements) is absent; the bundled IDs on the REQ (T461/T469/T470/T476) test orientation and state-persistence, not budget truncation. | `rg "T149" holonovel/scripts/` → none |
| SC-5 | REQ-333 Story journal to lore promotion | T380's only harness occurrence tests codex import provenance, not story-journal promotion; no `manage_story … promote` test exists. | `holonovel/scripts/test-output-contracts.ts:482`; `rg -i promote` → none |

All five are **evidence** gaps, not proven functional bugs: the behavior may be
implemented but is not exercised by the ID the spec maps to it. Reclassification
is correct until a real test is added: each should drop from C to B
(cited, unexercised).

## Minor / systemic findings

- **SC-6 (P2, systemic) — test-name ID inflation.** 40+ harness test names
  bundle ≥4 `T`/`S` IDs; the exercised-ID mechanism
  (`scripts/validate.ts:1402-1415`) counts every bundled ID, so one test can
  hold many REQs at bucket C. This is the root cause of SC-1…SC-5 and makes
  bucket C an unreliable conformance signal. A candidate detector
  (`orphan-test-id`) was added to `compare-spec-code.ts`; it is a review
  generator (over-flags IDs evidenced elsewhere), not a verdict.
- **SC-7 (P3) — 97 bucket-C REQs are cited only in comments.** This is expected
  here (the codebase cites REQs in comments above the implementing symbol) and
  is not itself a defect; recorded for the risk-pool audit trail only.

## Conformant / not findings

- 0 A, 0 B, 0 D REQs; every bucket-C REQ has a code citation and an exercised
  ID; all 31 harnesses pass; placeholder-stub and harness-gating guards pass.
- 112 E REQs are intended builder/verifier-side gaps with recorded
  dispositions; not compared against `holonovel/src` (correct surface).

## Method limitations (residual)

- Semantic verification was deep for the flagged pools and full-file for the
  confirmed findings; the remaining bucket-C REQs were adjudicated at
  citation + executed-ID level. Given SC-6, a clean citation+ID is necessary
  but not sufficient — the residual is enumerated in the fix plan, not claimed
  as fully verified.
- §6.6 sub-workflow IDs (`S…`) were not re-executed here; the Pattern Buffer
  harness passes as part of `test:all` (`run_pattern_buffer.ts`).

## Evidence

```
npm run assemble && npm run check:fast      → 0 errors, 0 warnings; A0/B0/C386/E112
holonovel npm run test:all                  → EXIT=0; 31 harnesses; 0 failures
npx tsx scripts/compare-spec-code.ts --check → 498 REQs; parity buckets C386/E112
npm run typecheck                           → EXIT=0
npm run check-script-discipline             → PASS (2 trees, no violations)
```

## Execution outcome (2026-09-25)

All findings fixed or dispositioned in the same increment:

| Finding | Action | Result |
|---------|--------|--------|
| SC-1 REQ-113 | Added `T116/REQ-113` result-count test (`test-output-contracts.ts`) | register: C, exercised T116 |
| SC-2 REQ-124 | Confirmed no damage tool in a ruleset-free host; whitelisted as a ruleset-dependent intended gap with disposition | register: E (REQ-454 disposition added) |
| SC-3 REQ-134 | Added `T148/REQ-134` minimum-Player-surface test | register: C, exercised T148, S6 |
| SC-4 REQ-135 | Added `T149/REQ-135` briefing-budget test | register: C, exercised includes T149 |
| SC-5 REQ-333 | Added `T380/REQ-333` story-promote test; corrected the codex test name | register: C, exercised T380 |
| SC-6 test-name inflation | Added `checkTestNameInflation` warning to `validate.ts`; corrected the two confirmed mislabels (`T121/T116`→`T121`, codex `T380/…`→`T384/…`) | 11 over-stuffed names now warn |
| SC-7 comment-only cites | Record-and-close | Closed-P3 |
| SC-8 config drift (found during execution) | Spec declares `TTRPG_MAX_BRIEFING_TOKENS` (04-runtime.md:143); code read only `TTRPG_PROMPT_BUDGET`. Code now reads `TTRPG_MAX_BRIEFING_TOKENS` with `TTRPG_PROMPT_BUDGET` fallback | T149 verifies the declared config |

**Bounded-T1 deviation.** The plan's T1 ("split all 40+ over-stuffed names") was
narrowed to the two demonstrably mislabeled names: the remaining bundles are
integration tests whose grouped naming is the repo's accepted convention, and a
mass rename would have moved many REQs to bucket B without adding evidence. The
`checkTestNameInflation` warning now surfaces the class for review. Per the
declared bar (P0 + bounded spec-side P1), code-side P1 fixes were applied because
they are small and verifiable; REQ-124 — the one with no available
implementation surface — is dispositioned rather than faked.

**Post-fix gates.**

```
npm run validate:sdd -- --impl-audit=strict  → EXIT=0; A0/B0/C385/E113; 0 errors
npm run check                                → EXIT=0; 0 errors (144 informational warnings)
holonovel npm run test:all                   → EXIT=0; 31 harnesses; 0 failures
npm run typecheck                            → EXIT=0
```

