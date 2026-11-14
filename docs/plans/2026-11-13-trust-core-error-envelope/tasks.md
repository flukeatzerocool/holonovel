# Tasks — Trust-core error envelope

Plan: `plan.md` (v3; `cold-review.md` v1 blockers, `re-review.md` diff pass,
`aar.md` outcome). Baseline 2026-11-13, HEAD `8edaa54`, clean tree, all fast
gates passing.

| # | Step | Files | Command | Result |
|---|---|---|---|---|
| 0 | Probe runtime shapes | `/tmp/opencode/probe-envelope{,-2}.mts`, `probe-pacing{,-2}.mts` | `npx tsx …` | done — refused call is a result with `isError`, no structured; structural error is a tool result with `[ERROR] [INVALID_INPUT]`; retired alias `[ERROR] [NOT_FOUND]`, no structured; pacing not readable through any surface; `manage_story`/`manage_combat` return `RAW` |
| 1 | Red assertions | four harnesses | harness runs | done — T178/T180/T632/T634 failed as designed; T386c red proven by removing the guard (83/1) |
| 2 | C1 refusal normalization, `refusalResult`, pacing guard | `src/index.ts`, (state.ts unchanged) | T178, probe | done |
| 3 | C2 delete SDK override | `src/index.ts` | T180 | done |
| 4 | C3 status vocabulary | `src/index.ts` | T632 | done |
| 5 | C4 `values` + dispatcher envelopes | `src/index.ts` | T634, T180b | done |
| 6 | C5 spec edits | `spec/02-requirements.md` | `assemble`, `validate` | done — 0 errors |
| 7 | Full server suite + anchor repoints | `scripts/lib/holosuite-*.ts` | `test:all` | done — 15 anchors repointed, 56/56 |
| 8 | C7 registers, roadmap, coverage, changelog | eight files | `check:registers`, `check:roadmap`, `validate --write-register` | done |
| 9 | Gated verification | — | `assemble`, `check:fast` | PASS, 41/41 |
| 10 | AAR + commit | this directory | `npm run session:close` | done |

## Step 0 probe log

```
A GM-only refusal (player badge):  result, isError: true, structuredContent: null,
  "[FORBIDDEN] This tool is Game Master only. Corrective action: use set_badge to switch."
B structural (bad enum):          result, isError: true, structuredContent: null,
  "[ERROR] [INVALID_INPUT] MCP error -32602: Input validation error: …"
C semantic (scene type):          result, structuredContent {status ERROR, category NOT_FOUND,
  corrective_action, no isError}, text enumerates "social, exploration, neutral, combat"
D pacing:                         not exposed by health or the Novel file (0/0 across a refusal)
E small-profile dispatcher:       manage_adventure/manage_story/manage_combat returned raw JSON
  ([OK]/RAW), not a group refusal — recorded as an anomaly under F-P1-7
E2 retired alias (resolve_fate):  result, isError: true, structuredContent: null,
  "[ERROR] [NOT_FOUND] resolve_fate (action: roll) is retired. Use resolve_mechanic.fate_roll."
```

## Red log (step 1)

```
T178  expected bare [FORBIDDEN] path to carry the prefix + structured result
T180  structural error carried [ERROR] [INVALID_INPUT] (override) — must carry none
T632  machine-readable body status = RAW (manage_story list)
T634  structured error had no values[]
T386c fails with the pacing guard removed (83 passed, 1 failed) and passes with it (84/0)
```

## Existing-expectation reconciliation (discovered in step 7)

Five assertions encoded the removed override and now accept the SDK shape:
`test-output-contracts.ts` G9, `test-belief.ts` T753/T756, `test-selection.ts`
T720, `test-memory-recall.ts` T699.

## Evidence

- `npm --prefix holonovel run test:output-contracts` → 516 passed, 0 failed
- `npm --prefix holonovel run test:backfill` → 117 passed, 0 failed
- `npm --prefix holonovel run test:lean-narrator` → 16 passed, 0 failed
- `npm --prefix holonovel run test:narrative` → 84 passed, 0 failed
- `npm --prefix holonovel run test:all` → 56 passed, 0 failed (160.4s)
- `npm run validate -- --write-register` → 0 errors, 287 warnings
- `npm run assemble && npm run check:fast` → 41 passed, 0 failed, `check:fast: PASS`
- Regenerated artifacts: `holonovel/tool-definitions.json` (37 tools, 124251 B),
  `spec/audit/tool-surface-baseline.json`, DECISIONS surface budget
  29,417 → 29,806 tokens.
