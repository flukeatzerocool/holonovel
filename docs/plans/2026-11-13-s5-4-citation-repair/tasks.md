# Tasks — §5.4 citation repair (REQ-104c / T103)

Plan: `plan.md` (amendment A1 appended during execution). Baseline 2026-11-13,
HEAD `554a446`, clean tree: `check:fast` 41/41 PASS; `test:character-creation`
13 pure + 6 server-tier; `test:workflow` 14 tests.

| # | Step | Files | Command | Result |
|---|---|---|---|---|
| 0 | Increment directory + plan copy | `docs/plans/2026-11-13-s5-4-citation-repair/` | `mkdir` + `cp` (sha256 3b2768fe…) | done |
| 1 | Red assertions (C2) | `test-workflow.ts` | `npm --prefix holonovel run test:workflow` | 16 passed, 2 failed (both T103 create-undo, "[STATE_CONFLICT] Nothing to undo") |
| 2 | C1 snapshots | `src/index.ts` (`:4263`, `:4813`) | test:workflow; `/tmp` probe | 18 passed, 0 failed; undo succeeds in both modes |
| 3 | Server suite | — | `npm --prefix holonovel run test:all` | **FAIL** 52/4 — 14 `predicate_unresolved` anchor drifts |
| 4 | A1 delta amendment + re-stamp | `plan.md`; four `holosuite-*` libs | `plan-gate.mjs stamp-plan`; `test:all` | 56 passed, 0 failed |
| 5 | C3 coverage register | `spec/audit/req-coverage.md` | `npm run validate -- --write-register` | REQ-104 row: `T32, T468, T103, T141`; 0 errors |
| 6 | C4 review register | `spec/audit/review-register.md` | `check-registers` | F-P3-8 Resolved under `## Resolved`; Scheduled-roadmap stub removed |
| 7 | C5 ROADMAP | `ROADMAP.md` | `check-roadmap` | section removed |
| 8 | C6 CHANGELOG | `CHANGELOG.md` | — | dated entry added |
| 9 | C7 tasks + AAR | this directory | `check-loop-artifacts` | |
| 10 | Gated verification | — | `assemble`, `check:fast`, conformance, registers, roadmap | |

## Red log (step 1, HEAD `554a446`, before C1)

```
FAIL T103/REQ-104c: undo after quick creation removes the character and leaves the roster unchanged:
  expected to contain "[OK]", got: [STATE_CONFLICT] Nothing to undo.
FAIL T103/REQ-104c: undo after step-by-step creation removes the character:
  expected to contain "[OK]", got: [STATE_CONFLICT] Nothing to undo.
16 passed, 2 failed
```

The third and fourth T103 assertions (pending refusal, drained stack) passed
before C1 — they cover behaviour the server already had.

## Step 3 log — anchor drift (amendment A1)

```
FAIL novel: 100 passed, 5 failed
  FINDING [P1] novel/predicate_unresolved @ holonovel/src/index.ts:11976#context_report — line 11976 is a comment
  … (11722#recap, 9957#knowledge_query, 11997#visibility_check, 12783#computeBundleIntegrity)
FAIL adversarial: 26 passed, 6 failed (same class)
52 passed, 4 failed
```

Cause: C1 inserted two lines into `src/index.ts`; the Holosuite tiers pin
`anchor("holonovel/src/index.ts", <line>, "<symbol>")` constants. Repointed 13
anchors (+1 for recorded lines 4263–4811, +2 above 4811); each new line was
verified to contain its symbol before editing. Re-run: 56 passed, 0 failed.

## Evidence

- `git status --porcelain` before step 0: clean (only the new increment dir
  untracked afterwards). Changed set equals the blast-radius table plus the
  four `holosuite-*` libs added by A1.
- `npm --prefix holonovel run test:workflow` → 18 passed, 0 failed.
- `npm --prefix holonovel run test:all` → 56 passed, 0 failed (164.3s).
- `npm run validate -- --write-register` → 0 errors, 287 warnings; register
  lists T103 on REQ-104.
- `/tmp/opencode/probe-profile.ts` → quick and step-by-step creation both undo
  (`[OK] Undo successful`; subsequent sheet read reports no active entity) and
  the roster stays empty.
