# Tasks — U1: foundations and constitution review

Ordered; tasks expand the plan's numbered steps (the two numberings are
related but not identical). A task is done when its evidence exists in
`review.md`, the register, the worklist, or a captured command exit code — not
when the reading is finished.

## Phase 1 — Mapping (must precede verdicts)

- [x] T1 Read every predicate in the enforcement table; record condition,
      severity (error / warning / print / report-only / gated), and anchor in
      `review.md`'s mapping table.
- [x] T2 Confirm the two boundary facts: `scripts/lib/parse-spec.ts` is the
      parser substrate the shape predicates call, and
      `check-script-discipline` / `check-script-quality` enforce no §1–§4 or
      Appendix A/M rule. Record both in the mapping table.
- [x] T3 Read `scripts/lib/contract-fingerprint.ts:27,37-43` and record the two
      fingerprint sets (EV8).
- [x] T4 Trace `--sdd-strict` end to end (`package.json:9,60` →
      `scripts/lib/gate-manifest.ts:33-36` → `scripts/validate.ts:50` →
      `:2245,2254,2360,2438`) and record it (settles C-3).
- [x] T5 Probe `--dedicated` end to end (`scripts/compare-spec-code.ts:589-601`
      plus its invocation at `scripts/publish/steps.ts:258`) — settles C-4.
- [x] T6 Create `review.md`: header, mapping table, 80 empty numbered rows with
      surface + anchor.

## Phase 2 — Verdicts (write each row with its predicate)

- [x] T7 §1–§3 — 3 rows; §3's eight failure modes each checked for a live
      guard at its named mitigation.
- [x] T8 §4 rules 1–12 — 12 rows; each rule mapped to its cited REQ's coverage
      bucket (`spec/audit/req-coverage.md`) and to a predicate or a declared
      non-mechanical status. `holds` requires bucket C (or a justified D/E);
      bucket B is a finding or a recorded gap.
- [x] T9 §4 Technology stack + Distribution — 2 rows.
- [x] T10 §4 terminology table — 1 row (citation resolution via
      `checkCrossRefs`; duplicate names against Appendices S and R).
- [x] T11 Appendix A blocks — 8 rows (`builder-side` where enforcement is
      deferred to §6.5).
- [x] T12 Appendix M checklist — 32 rows, mechanism anchor beside each.
- [x] T13 Appendix M SDD enforcement rules — 11 rows.
- [x] T14 Appendix M prose blocks — 11 rows (readability → `:614-647`; bloat
      indicator → `:802-819`).
- [x] T15 Resolve candidates C-1…C-11 explicitly (each becomes `holds` or a
      finding; none left unverified).

## Phase 3 — Triage and fix

- [x] T16 Assign P0–P3 per `AGENTS.md` "Review-loop governance"; every P0 has
      a demonstrated predicate.
- [x] T17 Apply bounded P0 prose corrections, starting with C-11
      (`appendices-reference.md:2847-2848`: `action-conflicts` is gated
      `--check`, not report-only). No §5 body edits; no Appendix M + validator
      co-change; re-read each edited paragraph against the grade-12 bar; a P0
      that would exceed ~10 lines stops the increment for a plan amendment.
- [x] T18 Write register entries under `### 2026-11-14 U1 foundations and
      constitution`; each cites its `file:line` predicate. Add the matching
      `ROADMAP.md` section for every `Scheduled-roadmap` row in the same step.

## Phase 4 — Bookkeeping, gates, close

- [x] T19 Update `worklist.md:91` (U1 exit evidence, script-gate boundary) and
      the `ROADMAP.md` trigger (next chunk U2).
- [x] T20 Write the `CHANGELOG.md` entry dated `2026-11-14`.
- [x] T21 Run the five non-loop gates, capturing un-piped exit codes:
      `npm run assemble` (only if `spec/` changed) →
      `npm run check-registers` → `npm run check-roadmap` →
      `npm run check-fingerprint-sync` →
      `npm run check-guarded-rule-change -- --base HEAD`. Confirm
      `check-loop-artifacts` accepts `review.md` as an extra increment file.
- [x] T22 Check the row budget (`grep -cE '^\| [0-9]+ \|' review.md` = 80) and
      finding-count parity (anchored patterns, `plan.md` Verification table).
- [x] T23 Write `aar.md` (row count, findings by severity, dispositions, gate
      results) ending `LOOP PAUSED`. If it earns `LOOP OPEN`, disposition the
      named item and re-run the AAR — the close refuses `LOOP OPEN`.
- [x] T24 `npm run check:fast` un-piped (`check:fast: PASS`), then
      `npm run session:close`.
