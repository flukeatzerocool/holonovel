# Tasks — REQ sentence-count enforcement

Ordered. Each task names its file and its verification. Do not start a task
whose dependency is unverified.

## T0 — Preconditions

- [ ] Confirm tree clean and baseline green: `npm run status`,
      `npm run check:fast` (last run: 2026-11-14, 41/41 PASS, HEAD `9a2f31f`).
- [ ] Re-run the over-limit enumeration and confirm the seven IDs and counts
      (`docs/plans/2026-11-14-req-sentence-enforcement/plan.md` Evidence).
      Abort and re-plan if the set changed.

## T1 — Red test first (E3, no production code yet)

- [ ] In `scripts/test-req-checks.ts`, add four assertions across three cases
      against `checkReqSentenceCount` built from a spec-shaped fixture through
      `extractReqBodiesWithSentences`:
      nine counted sentences → one issue naming the REQ; eight → none; eight
      normative plus three `*Acceptance criterion:*` sentences → none.
- [ ] Assert the issue text does not contain `review for splitting`
      (`scripts/validate.ts:2244` keys the warning downgrade on it).
- [ ] Run `npx tsx scripts/test-req-checks.ts`; expect a module-resolution or
      missing-export failure (red). Record the failure in `aar.md` notes.

## T2 — Predicate (E1, E2)

- [ ] `scripts/lib/req-checks.ts`: export
      `checkReqSentenceCount(reqs: Map<string, { id: string; sentences: string[] }>): string[]`
      — a structural type, so the module keeps its import-free shape.
- [ ] `scripts/validate.ts:223-257`: `checkReqShape` appends
      `checkReqSentenceCount(reqs)` to `issues`.
- [ ] Verify: `npx tsx scripts/test-req-checks.ts` green (T1 cases pass);
      `npx tsc --noEmit` clean.

## T3 — Error-gate dry run (corpus)

- [ ] `npm run assemble && npm run validate --sdd-strict`; expect exactly seven
      ERROR lines (the seven REQs) and nothing else new.
- [ ] Classify: each line is a true defect (verified by reading the counted
      sentences in T0); record the seven-line output verbatim in `aar.md`.
- [ ] Abort if a false positive appears (a body of eight human sentences
      flagged); that is a plan defect, not a corpus defect.

## T4 — Corpus compression (E4)

For each REQ in the plan's compression table, in this order (largest count
first): REQ-232a, REQ-318a, REQ-078c2, REQ-072c1, REQ-096d1, REQ-200,
REQ-246b1.

- [ ] Edit only `spec/02-requirements.md`; keep the header line, the `_Check:`
      trailer, and every field/property name.
- [ ] After each edit: counted sentences ≤ 8, full-body length ≤ 800 measured on
      the assembled spec. Re-measure REQ-096d1 first: its join is
      length-neutral (~796 chars, about four characters of headroom), so reject
      any variant that lengthens it.
- [ ] `npm run assemble && npm run validate --sdd-strict` → the REQ-shape block
      prints `PASS: All REQs satisfy SDD shape constraints`, errors 0.
- [ ] Re-run the enumeration script; expect 0 over-limit REQs.

## T5 — Reconcile the claims (E5, E6)

- [ ] `spec/appendices-reference.md:2949`: name the counted region as the body
      truncated at `*Acceptance criterion:*` (a trailing `_Check:_` stays inside
      the count) and that counting uses the shared sentence splitter.
- [ ] `spec/appendices-reference.md:2867`: same qualifier, one clause.
- [ ] `AGENTS.md:173-174`: move the 800-char limit out of the "REQ shape"
      parenthetical (it is a `checkSpecViolations` rule) and name Appendix M
      for the sentence limit.
- [ ] Verify: no stale "8-sentence" claim remains that the predicate
      contradicts (`rg -n '8-sentence|≤ 8 sentences|eight sentences'`).

## T6 — Close the finding (E7, E8)

- [ ] `spec/audit/review-register.md`: move F-U1-3 into the
      `### 2026-11-14 U1 foundations and constitution` block under
      `## Resolved`; reuse its "never counted" phrasing, state the predicate
      (`checkReqSentenceCount` in `scripts/lib/req-checks.ts`), the seven
      compressed bodies, and the test; keep a dated `Resolved (2026-11-14)` and
      a `Predicate:` line; keep the words `Appendix M` in the entry.
- [ ] Update that block's intro to "Four findings were demonstrated prose
      defects and are fixed here" and name F-U1-3 as fixed in the 2026-11-14
      sentence-count increment.
- [ ] `ROADMAP.md`: delete the `## REQ sentence-count enforcement (P1)` section.
- [ ] Verify: `npm run check-registers` PASS, `npm run check-roadmap` PASS.

## T7 — Regeneration (E11)

- [ ] `npm run build-order` (assemble → regenerate fingerprints → full check).
- [ ] Confirm `holonovel/src/generated/contract-fingerprints.ts` changed
      (REQ-072c1/REQ-232a are §5.6, REQ-096d1 is §5.9).
- [ ] `git diff --stat` is a subset of the blast-radius table (plus `README.md`
      only if a marker moved); any other path is an unplanned consequence —
      stop and amend the plan.

## T8 — Changelog and close (E9, E10)

- [ ] `CHANGELOG.md`: insert a new top-level
      `## 2026-11-14 — REQ sentence-count enforcement` heading directly above
      the current `## 2026-11-14 — Foundations and constitution review (U1)`
      section (later same-date headings already exist in the file; the subject
      must come from the new top heading), describing the predicate, the
      compression, the reconciliation, and the register/roadmap close.
- [ ] Write `aar.md` (after-action-report skill), ending `LOOP PAUSED` or
      `LOOP OPEN`; every finding dispositioned.
- [ ] `npm run session:close` → one commit whose subject derives from the
      CHANGELOG heading; the pre-commit hook runs
      `check-guarded-rule-change` (acknowledged by T6's register entry).

## T9 — Post-commit verification

- [ ] `npm run check:fast` at the committed tree → `PASS`.
- [ ] `git show --stat HEAD` matches the plan's blast radius (no incidental
      file).
