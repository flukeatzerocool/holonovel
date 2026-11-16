# After-action report — Roadmap drain 4: item 3 chunk 3 (execution stop)

Covers `docs/plans/2026-11-16-roadmap-drain-4`. The plan was approved at revision 4
(cold pass + two re-reviews); execution ran P1, closed the confirmed citations, and stopped
when P1's measurement invalidated the bar.

## What was supposed to happen

Execute P1–P5: triage all 91 linkage findings into class (a) label gap / (b) no assertion /
(c) manual by row content, label every class (a) row, author or reclassify the rest, and
finish with class (a) zero in a fresh `validate`, `test:all` green, one commit.

## What happened

| Phase | Outcome |
|---|---|
| P1 | 91 rows over **81 distinct T-IDs** measured; the label channel proved narrower than EV4 assumed; 6 class (a) homes confirmed and quoted; T420/T425/T439 proven class (b) |
| P2 | 6 labels added — 2 harness test names (`test-persistence.ts:772`, `test-persistence-guardrails.ts:439`) and 3 `validate` report strings (`checkCouplingCompleteness` ×3, `checkPatternBufferBlockingParity` ×1 at `:1048`) |
| P3a | REPLACED — the two bogus paths fixed: REQ-451's body and the T541/T542 rows now name `holonovel/scripts/…` |
| P3b/P3c | NOT RUN — no assertion authored, no row flipped to `Manual` |
| P4 | Corpus (85 rows) and coverage register regenerated; `ROADMAP.md` item 3 rewritten with the measured count and split; dated register subsection added |
| P5 | `assemble`, `check:fast` 46/46, `test:all` 56/56, this AAR, one commit |

`validate` moved **91 → 85 findings**, 0 errors, 390 warnings. The G7 attestation was
regenerated because the spec hash advanced (only `SPEC_HASH` changed).

## Deviations from plan

- **The done bar was superseded mid-execution.** Revision 4's bar — class (a) zero across
  all 91 — needed a per-row assertion read for every row; the plan sized that "M" and it is
  not one session's work. The evidence is in `plan.md` §9 and `tasks.md` "P1 outcome".
  The increment claims only what it did: 6 citations closed, 2 path defects fixed, the
  remaining 85 measured and split. No row was reclassified to shorten the list.
- **P3a was replaced, not skipped.** The `re-cite` verdicts turned out to be a citation
  defect *plus* an unlabelable row (EV5), so the fix is a path correction and the rows stay
  findings.
- **`docs/plans/2026-11-15-req-evidence-linkage/corpus.md` is regenerated** (85 rows) even
  though the increment is partial, so the corpus never lags the check.

## Finding triage

| # | Finding | Disposition |
|---|---|---|
| F1 | 6 citations unlabelled though asserted | **Fixed** in this increment |
| F2 | 85 findings remain, each needing a per-row assertion read | **Scheduled** — `ROADMAP.md` item 3, chunk 4, with the split by owner and the trigger unchanged |
| F3 | `labelsFromContent` drops a report literal that begins with a `\n` escape | **Recorded** — `ROADMAP.md` bullet; chunk 4 sub-item (the quirk silently dropped `T434` until removed) |
| F4 | A report in a top-level script section is unreadable, so T493 and T682 are not label-closeable | **Recorded** — `ROADMAP.md` bullet; chunk 4 sub-item (admit the shape or re-cite) |
| F5 | T420/T425/T439 require "≥1 archetype per group" and no check asserts it | **Recorded** — `ROADMAP.md` bullet; class (b) is real, certified by `scripts/validate.ts:1097` |
| F6 | The plan's "M" sizing assumed the residue was mostly label gaps | **Scheduled** — the split in `ROADMAP.md` is the correction; the AAR does not restate it as a recommendation |

Registers: `spec/audit/review-register.md` carries the dated chunk-3 subsection; the
coverage register is regenerated. Nothing above is a prose recommendation without an owner.

## Verification

| # | Command | Result |
|---|---|---|
| V1 | `npx tsx scripts/validate.ts` | 0 errors, 390 warnings, `REQ evidence linkage: 85 finding(s)` |
| V2 | corpus regenerate + `diff` | byte-identical, 85 rows |
| V3 | `npm run test:validators` | 79 passed, 0 failed |
| V4 | `npm run check:fast` | `check:fast: PASS`, 46 passed, 0 failed |
| V5 | `npm run test:all` | 56 passed, 0 failed (177 s) |
| V6 | `npm run check-registers` / `check-roadmap` | PASS / OK (6 sections) |
| V7 | `npm run check-fingerprint-sync`, `check-g7-attestation` | PASS after regeneration |
| V9 | quote review | the 6 class (a) rows were re-read against their row descriptions and marked above |

## Skill findings

1. **SK record candidate — plan-review.** The cold pass found the right defects but the
   plan's sizing estimate ("M") was never challenged; a plan whose P1 is an inventory
   should state the expected inventory size and a stop rule. Recorded here; route through
   `skill-improvement-loop` if it recurs.

## Changelog entry

**Title:** Linkage chunk 3: six citations closed, the remainder split

**Summary:** The REQ evidence-linkage check fell from 91 to 85 findings. Six rows were
closed by naming the check that already asserts them, the two bogus citation paths were
fixed, and the remaining residue was measured row by row and split on `ROADMAP.md` instead
of being swept.

- `T17`, `T88`, `T421`, `T434`, `T435`, `T540` labelled on the tests and gates that assert
  them; `validate` reports 85 findings (was 91)
- `T541`/`T542` citation paths corrected to `holonovel/scripts/…`; the rows stay findings —
  a citation fix moves no verdict
- Two `labelsFromContent` quirks measured: a leading `\n` escape in a report literal is not
  collected, and a top-level script report is unreadable, so two rows cannot be labelled
- `T420`/`T425`/`T439` proven class (b): "≥1 archetype per group" is asserted nowhere
- `ROADMAP.md` item 3 rewritten with the measured 85 and the split by owner; dated
  register subsection added; corpus and coverage register regenerated

LOOP PAUSED
