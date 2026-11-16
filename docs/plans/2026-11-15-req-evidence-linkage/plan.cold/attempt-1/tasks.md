# Tasks — REQ evidence linkage (2026-11-15)

Dependency order. Each task names its own check; a task is done when its check
passes, not when the edit lands. Phase map: task 1 = P0 (preamble), 2 = P1, 3 = P2, 4 = P3, 5 = P4,
6 = P5, 7 = P6, 8–10 = P7, 11–12 = P8.

| # | Task | Depends on | Check |
|---|---|---|---|
| 1 | Confirm P0 (`checkImplCoverage:2051-2110`, B5 at `:2701-2711`, `exercised` at `:1448-1461`, the 122/99/23 split) | — | recorded in `plan.md` §2; no edit |
| 2 | `parseAppendixFRows` returns `{kind, desc, reqs}` (duplicate T-IDs union `reqs`) with `cells[2].trim()`; cached `getAppendixFRows` consumed by `:1712`, `:2052`, `:2634` and P5 (four sites); delete `parseAppendixFReqTests` | 1 | `npm run validate` — 0 errors; buckets A 0 / B 0 / C 492 / D 0 / E 117; output still contains `PASS: Every harness title ID resolves to the Appendix F catalogue` |
| 3 | `getReqBodies` / `getDecisionsText` caches (`""` on absent file); `gatherExercisedIds` returns `new Set(collectHarnessTestNames().flatMap(t => t.all))` | 2 | `npm run validate` — buckets unchanged **and** `exercised test IDs: 685`; `sed -n '1448,1461p' scripts/validate.ts \| grep -c readFileSync` = 0 |
| 4 | `extractCheckCitations` (§3 rule) + `checkReqEvidenceLinkage` appended at `scripts/lib/req-checks.ts:645` | 3 | `npm run typecheck`; `grep -c 'node:fs' scripts/lib/req-checks.ts` = 0 |
| 5 | Self-tests appended after `scripts/test-req-checks.ts:673`: four reds, one green test with two assertions, one extraction case | 4 | `npm run test:validators` — 71 passed |
| 6 | Wire report-only in `main()` after `checkImplCoverage` (`:2605`): up to 10 `WARNING: REQ-EVIDENCE` then 5 `NOTE: REQ-EVIDENCE intended-gap` lines (sorted, outside-gap first), summary line, only outside-gap counted in `warnings` | 4, 5 | `npm run validate` exit 0 with the exact summary string; `REQ-EVIDENCE` line counts 10/5; `REQ-012 — T4 — Automated` present |
| 7 | Capture the implementation's own findings at `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` (one row per finding, sorted by REQ) | 6 | `grep -c '^| REQ-'` = 122 |
| 8 | `spec/audit/review-register.md`: dated `Scheduled-roadmap` row quoting **"REQ evidence linkage (P1)"**, no `REQ-…` token, Gate-kind note, the run's split | 7 | `npm run check-registers` |
| 9 | `ROADMAP.md`: replace the false T22/T35/T103 parenthetical with the named sentence; add the priority-P3 `T553` section with `**Trigger:**` | 7 | `npm run check-roadmap`; `grep -c 'each have an asserting harness'` = 1; `grep -c T553` ≥ 1 |
| 10 | `CHANGELOG.md` heading for the session | 8, 9 | heading matches the commit subject |
| 11 | P8 gates: `npm run assemble && npm run check:fast` | 2–10 | trailing `check:fast: PASS`; `npm run test:validators` reports 71 passed |
| 12 | Replace the placeholder `aar.md`, then `npm run session:close --single` | 11 | one commit; AAR ends `LOOP PAUSED` |

## Notes

- No npm script is added: the self-tests run through the existing
  `test:validators` (`package.json:65` → `scripts/test-req-checks.ts`).
- P0 is a recorded confirmation, not a stop point: B5 errors per REQ without
  naming the cited T-ID, and the bucket join reads Appendix F rather than the
  `_Check:_` text, so the new check's distinct output is (pair-level,
  kind-aware, T-ID-named).
- Error-mode and triage are out of scope; the ROADMAP trigger stays open.
- `scripts/compare-spec-code.ts:169` keeps its own copy of the row parser — a
  non-goal, not a deletion target.
