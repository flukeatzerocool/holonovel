# Tasks — Roadmap drain 8 (REQ evidence linkage chunk 7, the §7.7 archetype family)

Dependency order. Each task names its plan reference and the read that proves it. If a task
deviates, amend `plan.md` in the same phase rather than improvising.

## T1 — Dry run and dispositions (`plan.md` D5, P1)

Run V1's `validate` before editing anything and confirm the four D4 outputs are green on the
current tree. Re-read the check's own parse: 41 property groups, 12 archetypes plus
`[content source]`, 102 coupling rows, 0 empty cells, 0 unused archetypes. Write
`dispositions.md` with one row per finding (`| REQ | T-ID | class | cite | home | action |`):

- `REQ-369b` / `T420` — clause: every coupling row cites a valid pattern rule and no archetype
  assignment is orphaned;
- `REQ-374b` / `T425` — clause: every property group carries ≥1 archetype, reported;
- `REQ-374b` / `T439` — clause: the 12-archetype vocabulary and the content-source exclusion.

`action` is `author` for all three; `home` is the assertion's line in `scripts/validate.ts`.

If any D5 defect appears (empty cell, vocabulary mismatch, unused archetype), stop here: record
the reading, leave the registers untouched, and schedule the fix as its own increment.

## T2 — The parse and the assertions (`plan.md` D2, D4, P2)

In `scripts/validate.ts`, inside `checkCouplingCompleteness` (`:1056-1229`):

1. amend the property-table parse (`:1087-1090`) to keep cell position — split, trim, drop only
   the leading/trailing delimiter empties, then index; a row with fewer than four cells is
   reported, not dropped;
2. add exactly four outputs: non-emptiness (after the table parse, `:1100`); vocabulary equality
   against `VALID_ARCHETYPES` (`:1058`); archetype usage by coupling rows (after `:1141`); the
   `T425` completeness summary beside the `T434` report (`:1222`).

Wording is D4's, verbatim. Do not touch the unknown-token `WARNING` (`:1097`), the existing
`T421`/`T435` messages, or any other check function. Re-read the group count after the parse change
(expect 41) before adding the assertions.

## T3 — Mutation probes (`plan.md` D7, V3–V5, P3)

On a scratch copy of the tree, prove each assertion fires: empty the `Scene` archetype cell
(V3, summary `40/41`); set it to `Bogus` (V4, error plus the retained warning); delete the four
`Mechanics → *` rows (V5, the usage error plus four `T435`). Record each emitted message in
`aar.md`. Restore the tree and confirm `git status --porcelain` is empty before T4.

## T4 — Registers (`plan.md` D6, P4)

1. `ROADMAP.md` item 3: residue 54, the three closed T-IDs, still exactly three bullets
   (`scripts/check-roadmap.ts:24`); `**Trigger:**` unchanged.
2. `spec/audit/review-register.md`: new `### 2026-11-17 — REQ evidence linkage chunk 7`
   subsection under `## Scheduled-roadmap`. Name T-IDs and dates only, no `REQ-` tokens
   (`scripts/lib/register-checks.ts:64-69`).
3. The only corpus and coverage-register writes:
   `npm run validate -- --write-linkage-corpus docs/plans/2026-11-15-req-evidence-linkage/corpus.md`
   and `npm run validate -- --write-register`.
4. `CHANGELOG.md`: the dated entry (date equals the commit subject's date).

## T5 — Artifact, then gates (`plan.md` V1–V8, P5)

Write `aar.md` first — it is an input to `check-loop-artifacts`, which runs strict inside
`check:fast`. Then run V1–V8 in order and record every reading in `aar.md`, including the mutation
probes and the anchor delta for roadmap item 4. `check:fast` must be un-piped.

If `check-fingerprint-sync` or `check-markers` fails, run `npm run check-tool-definitions-sync`
and `npm run refresh-properties`, then re-run V7; do not fold a version-surface advance into this
increment.

## T6 — Close (`plan.md` Done bar)

`aar.md` carries the `## Changelog entry` block, the statement that the three rows are exercised
by an assertion (not by a copied ID), and `LOOP PAUSED`; then
`npm run session:close --single`.
