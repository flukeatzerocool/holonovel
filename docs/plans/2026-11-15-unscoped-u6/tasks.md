# Tasks — U6: synthesis and fixtures

One task per phase, one sub-task per row group. Every task closes only when its
evidence line is recorded. Row numbering matches `plan.md`'s budget and
`review.md`'s table.

## T0 — Precondition

- [ ] T0.1 Confirm HEAD `5980ed2`, tree clean, `check:fast` 45/45 (EV2).
- [ ] T0.2 Re-evaluate the re-measurement trigger; record the count (0 today).
- [ ] T0.3 Advance `ROADMAP.md:30-31` to U6.
- [ ] T0.4 Record U6-F1 (half-run close protocol) and U6-F2 (stale X/Y/Z
      anchors) for the Phase 4 register write.
- [ ] T0.5 Complete the increment directory: `plan.md` copied (hash-equal to
      the stamped draft) and this `tasks.md` authored.

## T1 — §11 (R1–R27)

- [ ] T1.1 Run the five probes (`manage_synthesis`, `synthesis://`,
      `SYNTHESIS_AUTO_TRIGGER`, synthesis fingerprint, `[LOW]`).
- [ ] T1.2 Settle R1–R7 (lead-in, 11.1, 11.2 lead-in, auto-trigger, source
      inputs, synthesis rules, module catalogue).
- [ ] T1.3 Settle R8–R15 (boundaries through idempotence).
- [ ] T1.4 Settle R16–R21 (reversion through rebuild scenarios).
- [ ] T1.5 Settle R22–R27 (11.4 lead-in through REQ-451).
- [ ] T1.6 For each clause with no predicate, write a `DEFECT` row with its
      disposition (`Scheduled-roadmap` for behaviour change, prose repair for an
      over-claim).

## T2 — Fixture matrix and appendices (R28–R57)

- [ ] T2.1 Settle R28 (fixture coverage matrix) first — it states the mapping
      the other 29 rows verify.
- [ ] T2.2 Settle R29–R34 (Appendix B).
- [ ] T2.3 Settle R35–R38 (Appendix C).
- [ ] T2.4 Settle R39–R43 (Appendix N).
- [ ] T2.5 Settle R44–R48 (Appendix W).
- [ ] T2.6 Settle R49–R51 (Appendix X).
- [ ] T2.7 Settle R52–R54 (Appendix Y).
- [ ] T2.8 Settle R55–R57 (Appendix Z).
- [ ] T2.9 Record every fixture that no harness consumes as `builder-side`
      **with a reason**; a matrix/appendix claim contradicted by the tree is a
      `DEFECT`.

## T3 — Assets and harnesses (R58–R66)

- [ ] T3.1 R58 `test:playability`.
- [ ] T3.2 R59–R61 the six `test:holosuite-*` commands.
- [ ] T3.3 R62 `test:supplementary`.
- [ ] T3.4 R63 `test:competitive-gaps`.
- [ ] T3.5 R64 `test:world-provider`.
- [ ] T3.6 R65 `git status --porcelain holonovel/testdata` before and after the
      runs; any writer other than the emitter is the C-2 finding.
- [ ] T3.7 R66 `check-fixture-emitter`.

## T4 — Disposition (Phase 4, in order)

- [ ] T4.1 (4.1) Write `review.md`: 66 rows, `R1`–`R66`, none `UNSET`.
- [ ] T4.2 (4.2) Write the register entry `### 2026-11-15 U6 synthesis and
      fixtures` with every `DEFECT` dispositioned; spot-check surviving
      `file:line` citations with `sed -n`; carry U6-F1 and U6-F2.
- [ ] T4.3 (4.3) Update `worklist.md`: U6 row `:96` in the `**reviewed
      2026-11-15** — 66 rows, …` form; amend the U6 `**Exit evidence:**` line;
      correct the Prose-line anchors `:256-258` to X `:974` / Y `:1084` /
      Z `:1123`.
- [ ] T4.4 (4.4) Advance `ROADMAP.md:30-31` to U7 (not on the K4 branch).
- [ ] T4.5 (4.5) Apply only the demonstrated prose fixes, inside
      `spec/08-synthesis.md` and `spec/appendices-fixtures.md`.
- [ ] T4.6 (4.6) `npm run assemble`, then
      `npx tsx holonovel/scripts/generate-g7-attestation.ts`.
- [ ] T4.7 (4.7) Write the dated `CHANGELOG.md` section, then `aar.md` with the
      done-bar verdict, conditions C-1/C-2, and the terminal token.
- [ ] T4.8 (4.8) `npm run session:close` — one commit.

## T5 — Verification (V1–V9, un-piped)

- [ ] V1 `npm run assemble` → exit 0.
- [ ] V2 `npm run check:fast` → 45 passed, 0 failed, PASS.
- [ ] V3 row count → 66.
- [ ] V4 `npm run check-loop-artifacts` → pass.
- [ ] V5 `npm run check-registers:strict` → pass.
- [ ] V6 `npm run check-roadmap` → pass, pointer reads U7.
- [ ] V7 `npm run check-fingerprint-sync` → pass.
- [ ] V8 `npm run lint` + `npm run validate:sdd` → 0 errors.
- [ ] V9 `npm run check-anchors` → pass.
