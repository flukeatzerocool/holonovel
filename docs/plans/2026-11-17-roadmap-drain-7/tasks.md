# Tasks — Roadmap drain 7 (REQ evidence linkage chunk 6, class (c))

Dependency order. Each task names its plan reference and the read that proves it. `n` = the rows
P1 sends to `author` (expected `n = 3` from EV9; `n = 0` if P1 refutes all three). If a task
deviates, amend `plan.md` in the same phase rather than improvising.

## T1 — Triage and the V9 baseline (`plan.md` D4, P1)

Read the corpus as it stands (72 rows, no regeneration) and, for each of the 15 class (c) rows,
read the Appendix F text and the cited REQ body. Apply D4:

- `closed` — the clause needs a built ruleset and has no in-repo-checkable half;
- `author` — any part is assertable in this repository (EV9 names T344, T345, T347 as candidates);
  name that part in the `cite` column.

Write one `dispositions.md` row per finding (`| REQ | T-ID | class | cite | home | action |`):
`closed` rows carry `—` in `cite` and `home`; `author` rows name the in-repo clause in `cite` and
its `path:line` in `home`. Also capture V9's baseline (plan P1's `awk` command) into
`/tmp/opencode/d7-bucket-before.txt`. Those two files are the only writes.

## T2 — Appendix F kind flips (`plan.md` D3, P2)

Edit each `closed` row's `Type` cell in `spec/appendices-reference.md`, by T-ID — six rows are
canonically padded, nine are not, so never rewrite by pattern:

- `:1464` T21 · `:1466` T25 · `:1475` T36 · `:1642` T130 · `:1727` T252 · `:1780` T290 ·
  `:1782` T292 · `:1784` T294 · `:1785` T295 · `:1818` T343 · `:1819` T344 · `:1820` T345 ·
  `:1822` T347 · `:1875` T405 · `:1900` T430

Nothing else in the table changes. Then `npm run assemble`.

## T3 — The Manual procedures (`plan.md` D3, P3)

In `holonovel/DECISIONS.md`, extend the section at `holonovel/DECISIONS.md:3108` with the dated
lead-in and one bullet per `closed` T-ID, ascending, in the exact shape
`- **`Tnn` — <title>.** Actor: … Precondition: … Procedure: … Record: …`. The four labels are
mandatory and in that order; each `Record` names the container that yields the fixture (D8).

## T4 — Registers (`plan.md` D6, D8, P4)

1. `ROADMAP.md` item 3: fold the residue (`57 + n`), the `author` rows' T-IDs, and the D8
   sentence into the three existing bullets as continuation lines. Never add a fourth bullet
   (`scripts/check-roadmap.ts:24`). `**Trigger:**` unchanged.
2. `spec/audit/review-register.md`: the chunk-5 supersession note, then the new
   `### 2026-11-17 — REQ evidence linkage chunk 6` subsection (or `chunk 6a`) inserted after
   `:3192`, under `## Scheduled-roadmap` (`:3086`).
3. The only corpus and coverage-register writes of the increment:
   `npm run validate -- --write-linkage-corpus docs/plans/2026-11-15-req-evidence-linkage/corpus.md`
   and `npm run validate -- --write-register`.
4. `CHANGELOG.md`: the dated entry (date equals the commit subject's date).

## T5 — Artifact, then gates (`plan.md` V1–V9, P5)

Write `aar.md` first — it is an input to `check-loop-artifacts`, which runs strict inside
`check:fast`. Then run V1–V9 in order and record each reading in `aar.md`. `check:fast` must be
un-piped. V8 must print `rows 15 ids 15`.

If `check-fingerprint-sync` or `check-markers` fails, run `npm run check-tool-definitions-sync`
and `npm run refresh-properties`, then re-run V6; do not fold a version-surface advance into this
increment.

## T6 — Close (`plan.md` Done bar)

`aar.md` carries the `## Changelog entry` block, the "duty created, not executed" statement
(D8), and `LOOP PAUSED`; then `npm run session:close --single`.
