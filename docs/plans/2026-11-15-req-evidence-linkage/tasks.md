# Tasks — REQ evidence linkage (P1), increment 1

Phase map: 1 = P1, 2 = P2, 3 = P3, 4 = P4, 5–6 = P5, 7–8 = P6. A task is done when
its check passes, not when the edit lands.

| # | Task | Depends on | Check |
|---|---|---|---|
| 1 | `parseAppendixFTestText` returns `{kind, desc}` (kind trimmed, desc raw, last row wins); `:1723-1725` reads `.desc`; `:2634` keeps `.keys()`; add module-scope `getReqBodies` memo and use it at `:2054` | — | `npm run validate` — buckets A 0 / B 0 / C 492 / D 0 / E 117; `exercised test IDs: 685` |
| 2 | Append `CHECK_MARKERS`, `LinkageFinding`, `extractCheckCitations`, `checkReqEvidenceLinkage` to `scripts/lib/req-checks.ts`; use `CHECK_MARKERS` at `scripts/validate.ts:183` and `:2080` | 1 | `npm run typecheck`; no `fs`; `grep -c 'includes("\*Check:\*")' scripts/validate.ts` = 0 |
| 3 | Insert the seven named cases before the summary/exit block at `scripts/test-req-checks.ts:692` | 2 | `npm run test:validators` — 72 passed, seven names present |
| 4 | Wire report-only after `checkImplCoverage` (`:2605`): 10 `WARNING: REQ-EVIDENCE` lines, derived summary line, all 122 into `warnings`, `--write-linkage-corpus <path>` emitter, Manual skipped when `DECISIONS.md` is absent | 1, 2, 3 | V2's expectations, captured un-piped |
| 5 | Generate `corpus.md` through the new flag | 4 | `diff` against a regeneration is empty; 122 rows |
| 6 | `spec/audit/review-register.md:3085`: `### 2026-11-15 REQ evidence linkage (P1)` subsection under `## Scheduled-roadmap`, no `REQ-…` token | 5 | `npm run check-registers`; heading present exactly once |
| 7 | `CHANGELOG.md` heading; one-line `AGENTS.md` flag-count update; `npm run check:fast` | 4–6 | trailing `check:fast: PASS` |
| 8 | Real `aar.md`, then `npm run session:close --single` | 7 | `npm run check-loop-artifacts`; one commit; AAR ends `LOOP PAUSED` |

## Notes

- No new npm script: the cases run through `test:validators` (`package.json:65`).
- No `npm run assemble`: no phase edits an assembled source under `spec/`
  (`review-register.md` is not a source of `holonovel.md`), and `check:fast`
  already runs `validate` against the assembled spec.
- `parseAppendixFReqTests`, `compare-spec-code.ts:169`, `gatherExercisedIds`,
  the `DECISIONS.md` read cache, `ROADMAP.md`, and the `T553` renumber belong to
  increment 2.
- If the run's numbers differ from the plan's §1 table, stop and amend; do not
  adopt them.
