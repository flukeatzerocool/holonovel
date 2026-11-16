# Tasks — Roadmap drain 3: item 3 chunk 2

A task is done when its check passes, not when the edit lands. Re-grep every
`file:line` immediately before editing it (HEAD moves between phases).

| # | Task | Depends on | Check |
|---|---|---|---|
| A1 | `scripts/lib/req-checks.ts`: pure `labelsFromContent(text)` (single lexer, regex-literal aware) admitting a `test(...)` name, either argument of `check(...)`, and a `.push`/`console`/`return` literal inside `function check*(…): string[]`; `scripts/validate.ts` imports it and root `scripts/**/*.ts` joins the scan | — | `npm run typecheck`; server-harness component of `gatherExercisedIds` equal |
| A2 | `scripts/test-req-checks.ts`: injected-text cases — the three admitted shapes count; `// T999`, an unused literal, and `["T999"]` do not; a label naming another T-ID does not evidence the cited one | A1 | `npm run test:validators` — negative cases fail before A1 |
| B1 | Regenerate the corpus to a temp path; `diff` against `corpus.md` | — | Empty diff; 99 rows |
| B2 | Triage the 26 `scripts/validate.ts` rows with the Phase B table: name the T-ID in the report string its check function's failure prints, recording function and line; no covering check → `re-cite` | A1 | Every row carries `name` + function:line, or `re-cite` |
| B3 | Triage the 12 rows in 10 other root files by the same rule | A1 | Same table, same check |
| B4 | Apply `re-cite` edits in `spec/02-requirements.md`; `npm run assemble`; `npm run build-order` when a fingerprinted section moved | B2, B3 | `validate` 0 errors; `check-fingerprint-sync` when the spec changed |
| C1 | Regenerate `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` and `spec/audit/req-coverage.md` (`npm run validate -- --write-register`) | B2–B4 | Corpus reports 99 − N; register freshness gate green |
| C2 | `spec/audit/review-register.md`: chunk 2 of 3; residue split "gate exists, unasserted" / "no script cites the REQ"; chunk 3 opens on the kind decision | C1 | `npm run check-registers` |
| C3 | `ROADMAP.md` item 3: **replace** the third bullet with the measured count and split (the section is at the 1–3 bullet cap); items 1, 2, 5, 7 untouched | C2 | `npm run check-roadmap` |
| D1 | `aar.md`: five-item dispositions, 38-row outcome, measurements, `## Changelog entry` | C3 | `npm run check-loop-artifacts` |
| D2 | Commit 1 `scripts` (typecheck, `test:validators`, `test:spec-tooling`, `validate`), commit 2 `spec/docs` (`assemble`, `check:fast`); `--single` when no REQ body changed | D1 | Fast gate PASS; clean tree |

## Phase B triage — 38 gate-side citations

Verdict per row is `name` (emitting-position string gains the T-ID) or `re-cite`. The
file column names **one** root script whose content matches the REQ id
(`grep -rl "<REQ>" scripts --include=*.ts`); it is not proof the script asserts the row.
Confirm the assertion before naming; re-grep the line.

| REQ | T-ID | File | Verdict |
|---|---|---|---|
| REQ-013 | T25 | scripts/validate.ts | defer-drill |
| REQ-013 | T36 | scripts/validate.ts | defer-drill |
| REQ-014 | T21 | scripts/validate.ts | defer-drill |
| REQ-044 | T17 | scripts/validate.ts | defer-drill |
| REQ-107a | T493 | scripts/build-order.ts | defer-noassert |
| REQ-110 | T113 | scripts/validate.ts | defer-noassert |
| REQ-123 | T130 | scripts/validate.ts | defer-drill |
| REQ-149 | T184 | scripts/validate.ts | defer-noassert |
| REQ-153 | T186 | scripts/validate.ts | defer-noassert |
| REQ-209 | T252 | scripts/validate.ts | defer-drill |
| REQ-270 | T290 | scripts/validate.ts | defer-drill |
| REQ-272 | T292 | scripts/validate.ts | defer-drill |
| REQ-274 | T294 | scripts/validate.ts | defer-drill |
| REQ-275 | T295 | scripts/validate.ts | defer-drill |
| REQ-277 | T297 | scripts/validate.ts | defer-noassert |
| REQ-278 | T298 | scripts/assemble.ts | defer-noassert |
| REQ-299 | T343 | scripts/validate.ts | defer-drill |
| REQ-299 | T430 | scripts/validate.ts | defer-drill |
| REQ-300 | T344 | scripts/validate.ts | defer-drill |
| REQ-301 | T345 | scripts/validate.ts | defer-drill |
| REQ-303 | T347 | scripts/validate.ts | defer-drill |
| REQ-313a | T497 | scripts/lib/spec-update.ts | defer-noassert |
| REQ-313c | T497 | scripts/update-server.ts | defer-noassert |
| REQ-314b | T497 | scripts/lib/spec-update.ts | defer-noassert |
| REQ-354 | T405 | scripts/validate.ts | defer-drill |
| REQ-395b | T464 | scripts/test-spec-tooling.ts | closed-by-scan |
| REQ-396 | T465 | scripts/lib/publish-guards.ts | closed-by-scan |
| REQ-398 | T467 | scripts/test-push-pipeline.ts | closed-by-scan |
| REQ-398 | T491 | scripts/test-push-pipeline.ts | closed-by-scan |
| REQ-416 | T489 | scripts/validate.ts | defer-noassert |
| REQ-418 | T491 | scripts/lib/publish-state.ts | closed-by-scan |
| REQ-419 | T492 | scripts/lib/parse-spec.ts | closed-by-scan |
| REQ-451 | T541 | scripts/validate.ts | re-cite |
| REQ-451a | T541 | scripts/validate.ts | re-cite |
| REQ-452 | T542 | scripts/validate.ts | re-cite |
| REQ-453 | T543 | scripts/validate.ts | name |
| REQ-454 | T544 | scripts/validate.ts | name |
| REQ-569 | T682 | scripts/surface-budget.ts | defer-noassert |

Verdicts: `closed-by-scan` — an existing admitted label already names the T-ID;
`name` — the T-ID was added to the check that asserts the row; `re-cite` — the row names a
path that does not exist; `defer-drill` — the row describes a builder drill recorded in
`DECISIONS.md`; `defer-noassert` — no admitted assertion exists (gate uses `fail()`, or no
test names it). Chunk 3 owns every `defer-*` row.

## Known starting points

- `scripts/test-spec-tooling.ts:404` (T464) and `scripts/test-push-pipeline.ts:154,342`
  (T467, T491) already carry their T-IDs; T465 sits in `scripts/lib/publish-guards.ts` — those rows close with no edit once A1
  admits the `check(...)` shape.
- `scripts/surface-budget.ts` has no assertion, only `fail()` at `:67` — T682 is `re-cite`
  unless B3 finds a check.
- `T497` spans seven REQs; one assertion can close all seven, so the row count falls
  faster than the edit count.

## Residue for chunk 3 — 61 citations over 49 REQs

No root or server script cites these REQs at all (measured 2026-11-16). Chunk 3 opens on
Dec-3: whether the linkage predicate admits a declared gate kind, or each REQ gets a
written, T-named assertion.

`REQ-011c T182`, `REQ-012 T4`, `REQ-082b T205`, `REQ-088h2 T379/T72/T73`,
`REQ-092h2 T88`, `REQ-100b T87`, `REQ-100d T87`, `REQ-107b T106`, `REQ-108b T107`,
`REQ-108c T538`, `REQ-111b T114`, `REQ-114b T117`, `REQ-131c T145`, `REQ-141b T163`,
`REQ-141k T537`, `REQ-141l T539`, `REQ-142b T164`, `REQ-142c T540`, `REQ-146d T174`,
`REQ-150b T185`, `REQ-154b T187`, `REQ-162c T197`, `REQ-207c T251`, `REQ-208b T250`,
`REQ-210b T173`, `REQ-211c T188/T253`, `REQ-212b T46`, `REQ-225b T301`,
`REQ-228c T304`, `REQ-243d T308`, `REQ-245e T310/T495`, `REQ-273b T293`,
`REQ-302b T346`, `REQ-313b T497`, `REQ-313d T497`, `REQ-314a T497`, `REQ-314c T497`,
`REQ-314d T497`, `REQ-315b T360`, `REQ-327c T371`, `REQ-369b T420/T436/T437/T438`,
`REQ-370b T421/T434/T435`, `REQ-371b T422/T428/T496`, `REQ-374b T425/T439`,
`REQ-375b T426`, `REQ-376a3 T431`, `REQ-376b T431`, `REQ-377d T432`, `REQ-378b T433`
