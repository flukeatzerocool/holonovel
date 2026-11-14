# Tasks — §5.3 citation repair

Dependency order. Each task names its verification. Gates run at the marked
steps; `check:fast` runs once at the end.

| # | Task | File | Verify | Depends on |
|---|---|---|---|---|
| 1 | Write `T22` — prompt list/get, runtime install/remove/restart, live `spec_health` counts under `game_master` (REQ-023b, REQ-025c) | `holonovel/scripts/test-output-contracts.ts` (beside `:2431`) | `test(` title appears; test passes | — |
| 2 | Probe the `run_workflow` sub-leg; keep it only if the stub tool categorizes (C-1) | same file | recorded in the AAR | 1 |
| 3 | Write `T35` — installed-package isolation + package title pass-through (REQ-024a) | same file | test passes; titles match the package declaration | 1 |
| 4 | Run the harness file | `npx tsx holonovel/scripts/test-output-contracts.ts` | exit 0 | 1–3 |
| 5 | Edit five Check lines (`:737`, `:776`, `:826`, `:837`, `:973`); keep T3, add T35, drop T39/T167/T168/T40 | `spec/02-requirements.md` | `grep` shows only exercised IDs (T3 exempt) | 4 |
| 6 | Amend T22/T35 Appendix F rows | `spec/appendices-reference.md:1455,1464` | rows match D1/D2/D2b | 5 |
| 7 | Resolve F-P2-1/2/3; add F-P2-5 (scheduled) | `spec/audit/review-register.md` | `npm run check-registers` | 6 |
| 8 | Remove ROADMAP §5.3; add the R1 depth section | `ROADMAP.md:15-28` | `npm run check-roadmap` | 7 |
| 9 | Assemble | `npm run assemble` | `holonovel.md` updated | 8 |
| 10 | Regenerate coverage register | `npm run validate -- --write-register` | no C→B change | 9 |
| 11 | CHANGELOG entry | `CHANGELOG.md` (top) | dated `2026-11-14`, bulleted | 10 |
| 12 | Full fast gate | `npm run check:fast` | `check:fast: PASS` un-piped | 11 |
| 13 | Register, citation, fingerprint gates | `npm run check-registers`, `npm run tool-citation-check`, `npm run check-fingerprint-sync` | exit 0 each | 12 |

## Commit

One commit, subject derived from the CHANGELOG heading by
`npm run session:close`. AAR written before close; `LOOP PAUSED` required.

## Results (2026-11-14)

| # | Outcome | Evidence |
|---|---|---|
| 1 | done | `npx tsx holonovel/scripts/test-output-contracts.ts` → `556 passed, 0 failed` |
| 2 | dropped (A3) | `runWorkflowCategories` walks the host registry (`index.ts:17031-17047`) |
| 3 | done | same harness run; titles match package declarations |
| 4 | done | same harness run |
| 5 | done | `validate` → 0 errors |
| 6 | done | `spec/appendices-reference.md:1455,1464` |
| 7 | done | `check-registers` PASS |
| 8 | done | `check-roadmap` PASS |
| 9 | done | `assemble` wrote `holonovel.md` |
| 10 | done | register diff = T22/T35 join REQ-021/023/024, no bucket move |
| 11 | done | CHANGELOG top entry |
| 12 | done | `check:fast` 41/41 after the AAR landed |
| 13 | done | `check-registers`, `tool-citation-check`, `check-fingerprint-sync` PASS |
## Execution amendments (2026-11-14, during build)

- **A1 — `tools/list` scope travels in `_meta`.** The SDK validates list params
  against its own schema and strips an unknown top-level `scope`; the handler
  reads `params._meta.scope` (`holonovel/src/index.ts:18393-18403`). The tests
  send `{ _meta: { scope: "all" } }`.
- **A2 — T35's post-removal listing leg was dropped.** A removed package's
  tools stay in the live `tools/list` (the SDK has no deregistration and the
  live handler does not apply `packageToolVisible`, which only guards
  `registeredToolDefinitions` at `:1580`). The behaviour is recorded as
  F-P2-6 and scheduled with R1; T35 asserts the isolation pair (absent before
  install, present with declared titles while installed) plus the removal
  acknowledgement.
- **A3 — no `run_workflow` sub-leg.** `runWorkflowCategories` walks the host
  surface registry (`:17031-17047`), which package tools do not join, so a
  runtime-installed stub never renders in the intent prompt. C-2 resolved as
  "drop and record"; the prompt-output-update clause remains evidenced by T155.

