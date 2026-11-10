# AAR — §5.21–§5.23 capability remediation (F-P6b-17, F-P6b-18)

Session date: 2026-11-10 · Plan: `plan.md` · Tasks: `tasks.md`
Terminal token: LOOP PAUSED

## Outcome

Both findings named by the first open roadmap section are resolved:

- **F-P6b-17** — Forged characters carry `consequences: string[]`; a named
  `mark` records the consequence once, a filling mark records trauma only, and
  `resist` removes the recorded consequence before spending its stress cost.
- **F-P6b-18** — every capability branch validates its op, arguments, and state
  lookups before `novelSnapshot()`, and the stress/character entry creation
  sits below the snapshot, so a refused call pushes no undo state and clears
  no redo stack.

The roadmap section is removed, the two findings sit under
`## Resolved — 2026-11-10 §5.21–§5.23 capability remediation`, and REQ-442,
§7.7.0, and the T528 catalogue row describe the behaviour the harness exercises.

## Red-test record (pre-fix, reproduced before the implementation)

- `test:forged` — 4 passed, **3 failed**:
  - `T528: a named mark records the consequence; resist removes it` —
    `expected to contain "recorded consequence 'Harm'", got: [OK] 'pc_1' stress now 2/8.`
  - `T528: an unrecorded or missing resist name is refused` —
    `expected to contain "[NOT_FOUND]", got: [OK] 'pc_1' resisted 'Shadow' for 2 stress (now 4/8).`
  - `T528: a filling mark records trauma, resets stress, and appends no
    consequence` — `{"entity_id":"pc_3","stress":0,"trauma":["Overreach"]}` (no
    `consequences` field).
- `test:persistence-guardrails` — 16 passed, **1 failed**: `T10/REQ-041a: a
  refused capability call pushes no snapshot and clears no redo` —
  `expected NOT to contain "Refusal Aspect A"` after one undo (the refusal had
  pushed a snapshot, so the undo reversed the refusal instead of the aspect).
- `test:backfill` — 99 passed, **1 failed**: `T121/REQ-116: redo survives a
  refused capability call` — redo returned `[ERROR] [NOT_FOUND] Room
  'redo-room-2' not found` (the refusal cleared the redo stack).

## Step-to-evidence table

| Step | Command | Result |
|---|---|---|
| Baseline | `test:forged` / `test:fate` / `test:backfill` / `test:persistence-guardrails` | all PASS before edits |
| T1 red tests | the three extended harnesses | 3 + 1 + 1 failures (above) |
| T2/T3 implementation | `npx tsc --noEmit -p holonovel/tsconfig.json` | exit 0 |
| T2/T3 verification | `test:forged` 7/7, `test:fate` 7/7, `test:ironsworn` 4/4, `test:backfill` 100/100, `test:persistence-guardrails` 17/17 | all exit 0 |
| T4 spec | `npm run assemble`; `npm run validate -- --sdd-strict` | assemble 0; validate 0 errors, 286 warnings; REQ-442 body 795/800 chars, 7 sentences |
| T5 regeneration | `generate-tool-definitions.ts`; `check-tool-definitions-sync`; `tool-definitions-lint`; `check-tdqs-scoreboard`; `surface-budget` | 37 tools, 0 violations; TDQS PASS; budget PASS after `--write` + DECISIONS header refresh (28,457 / 24,859) |
| T5 starter | `npm --prefix holonovel run build:starter-novel` | exit 0 — see deviation D-1 |
| T6 registers | `validate -- --write-register`; `check-registers`; `check-roadmap`; `check-traceability` | 0 errors |
| T7 gates | `npm run build-order`; `npm run check:fast` | recorded in the follow-up gate block below |

## Deviations

- **D-1 — starter-novel artifact regeneration.** `build-order` failed at
  `check-starter-freshness` because the packaged starter Novel embeds the spec
  hash. `npm --prefix holonovel run build:starter-novel` regenerated
  `holonovel/content/torre-nosferatu.json`; the file was added to the plan's
  Files expected and the plan re-stamped (condition C-4). This is the
  documented AGENTS.md regeneration sequence, not an unplanned change.
- **D-2 — concurrent session.** Another session committed its own increment
  (`d21ee13 — Unscoped-surface review program`) while this build ran. Its files
  were never staged here (condition C-3); the commit is scoped to this
  increment's planned files.

## Findings and dispositions

- F-P6b-17, F-P6b-18 → `Resolved` in `spec/audit/review-register.md` with
  post-change `file:line` predicates and exercised assertions (T528; T10 and
  T121).
- **P3, record-and-close:** 67 other `novelSnapshot()` call sites outside the
  capability branches were not audited. No failure for them is demonstrated;
  a repo-wide ordering audit stays a candidate for the unscoped-surface review
  program rather than a new roadmap row.
- **P3, record-and-close:** the `validate` proofreading warning count moved
  271 → 286 (register-relative baseline drift). Warnings are informational and
  no gate failed; the register refresh is `check-registers`' concern.

## Loop status

Gates green, findings dispositioned, no open P0/P1 outside the scheduled
roadmap. **LOOP PAUSED.**
