# Tasks — §5.4 remediation

Plan: `plan.md`. Baseline (2026-11-13, HEAD `842a71e`, clean tree):
`test:character-creation` 12 passed; `test:persistence` 49 passed;
`check:fast` 41/41 PASS; `check-registers` PASS (139 grandfathered-date INFO).

| # | Step | Files | Command | Result |
|---|---|---|---|---|
| 0 | Increment directory, plan copied | `docs/plans/2026-11-13-s5-4-remediation/` | `mkdir` + `cp` | done |
| 1 | Red assertions (C4) | test-character-creation.ts, test-persistence.ts | see log below | |
| 2 | C1 end-Novel audit record | state.ts, index.ts | harnesses | |
| 3 | C2 equipment source/omission | index.ts | harnesses | |
| 4 | C3 named error + atomic drain | character-creation.ts, index.ts | harnesses | |
| 5 | Spec rows, register, ROADMAP, DECISIONS, CHANGELOG | spec/, ROADMAP.md, holonovel/DECISIONS.md, CHANGELOG.md | `validate --write-register` | |
| 6 | Server suite | — | `npm --prefix holonovel run test:all` | |
| 7 | Spec gates | — | `assemble && check:fast` | |
| 8 | Build order + conformance + registers | — | `build-order`, `check:conformance`, `check-registers` | |
| 9 | AAR + commit | `aar.md` | `session:close` | |

## Red log (step 1)

Recorded before the implementation steps (2026-11-14, HEAD `842a71e`):

```
FAIL a failing derived-stat formula names the statistic and formula (REQ-399b)
  PASS T468/REQ-399b: quick mode returns the ruleset's labelled derived statistics
  PASS T468/REQ-152a: ruleset-declared equipment carries its declared source
  FAIL T468/REQ-152a: player-supplied equipment ... source = undefined for Torch
  FAIL T468/REQ-152b: ... omits the equipment key: equipment present: []
  FAIL T468/REQ-399b: ... got: Formula references undefined input 'ability_mod.nope'.
  FAIL T468/REQ-190: ... got: Formula references undefined input 'ability_mod.nope'.
  2 server-tier tests passed, 4 failed

FAIL T158/REQ-140: the disposal is recorded in the audit log ... last audit entry is create_novel
FAIL T158/REQ-447: an at-capacity audit log refuses the disposal ... got: [OK] Novel 'capacity-novel' ended.
  49 passed, 2 failed
```

## Evidence

- Step 1 (red): `test:character-creation` → 12 passed, 1 pure + 4 spawn
  failures; `test:persistence` → 49 passed, 2 failures (the new T158 clauses).
- Steps 2-4 (green): `test:character-creation` → 13 pure + 6 server-tier
  passed; `test:persistence` → 51 passed, 0 failed. `npx tsc --noEmit` → 0.
- Step 5: `npm run assemble` → written + build-phase-map hash updated;
  `validate --write-register` → 0 errors, 287 warnings, register written
  (buckets A 0 / B 0 / C 491 / D 0 / E 117).
- Step 7: `check:fast` → 41 passed, 0 failed, `check:fast: PASS`.
- Step 6 (delta): the first three `test:all` runs exposed 13 drifted Holosuite
  evidence anchors (line shifts from the plan's own edits); all repointed, no
  behaviour change. Final `test:all` run recorded below.
