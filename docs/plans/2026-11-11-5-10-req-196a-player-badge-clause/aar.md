# AAR — §5.10 REQ-196a Player-badge clause

## Phase 0 — baseline (before first edit)

| Check | Result |
|---|---|
| `npm run check:fast` | 40 passed, 0 failed, `check:fast: PASS` |
| `npm --prefix holonovel run test:competitive-gaps` | 30 passed, 0 failed |
| `npm --prefix holonovel run test:backfill` | 104 passed, 0 failed |
| `npm run validate:sdd` | 0 errors, 285 warnings |
| `npm run check-registers` | PASS (133 grandfathered, 0 findings) |
| `npm run check-roadmap` | OK, 16 sections |
| `git status --porcelain` | only the new increment directory |

Predicate re-check: `spec/02-requirements.md:3243` and `:3249`,
`spec/appendices-reference.md:1697` and `:2061`,
`spec/appendices-fixtures.md:831` and `:963-964` all match the plan.
`F-P6a-19` is the only `Scheduled-roadmap` row for this section; no row covers
the observer clause. `F-5.10-2` is free (only `F-5.10-1` exists).

## Phase 1 — probe (trust boundary: tool-output)

Probe: `/tmp/opencode/req196a-probe.ts` (uncommitted). It boots the real server
over MCP stdio with a temp `TTRPG_DATA_DIR`, seeds the `probe-percept` package
before the second boot, and prints the raw responses.

Body: create a Novel, `manage_world (action: convert)` with the Appendix K
fixture, `manage_character (action: create)` + `set_active`, `set_badge`;
then `run_command { action: "execute", command: "xyzzy" }` (and `look` /
`go north` controls) per badge configuration.

Captured output (verbatim, trimmed to the responses):

```
=== CASE A: ruleset-free, player badge, xyzzy ===
--- response ---
[ERROR] [UNIMPLEMENTED] Unknown verb 'xyzzy'. Valid commands include: ask, climb, close.
Corrective action: Use one of: ask, climb, close.
--- go north ---
[OK] The Hall of Statues

=== CASE C: ruleset-free, observer badge, look/xyzzy ===
[OK] Active badge: observer — read-only spectator mode
--- look ---
[FORBIDDEN] Observer mode is read-only. Corrective action: switch badges with set_badge to interact.
--- xyzzy ---
[FORBIDDEN] Observer mode is read-only. Corrective action: switch badges with set_badge to interact.

=== CASE B: ruleset-bound, player badge, xyzzy ===
[OK] Active badge: game_master
[OK] Novel created: probe-bound (novel://current)
[OK] Novel 'probe-bound' bound to ruleset 'probe-percept'.
[OK] Room 'Bay' created.
[ERROR] [INVALID_INPUT] Quick-create requires 'species' and 'classes'. Omit 'name' to start step-by-step, or provide all creation fields.
[ERROR] [NOT_FOUND] Entity 'character_01' not found.
[OK] Active badge: player
--- xyzzy ---
[ERROR] [FORBIDDEN] On a ruleset-bound Novel the parser is Game Master only for navigation and mutation. The Player may issue read-only perception commands (look, examine, search, inventory).
Corrective action: Switch badges with set_badge to gain access, or use a permitted tool.
--- look (control) ---
[ERROR] [STATE_CONFLICT] You are nowhere. The world model has not been populated.
Corrective action: Use an adventure module or CRUD tools to populate the world model.
--- go north (control) ---
[ERROR] [FORBIDDEN] On a ruleset-bound Novel the parser is Game Master only for navigation and mutation. The Player may issue read-only perception commands (look, examine, search, inventory).
Corrective action: Switch badges with set_badge to gain access, or use a permitted tool.
```

Conclusions: all three plan assumptions hold — ruleset-free Player reaches
`[UNIMPLEMENTED]` with a nearest-verb list, ruleset-bound Player is refused
`[FORBIDDEN]` before parsing (no list), and the ruleset-free `observer` call is
refused (`F-5.10-2` stands). The character-creation `[INVALID_INPUT]` is a
probe-fixture artifact (the minimal package requires species/classes) and does
not affect the badge gate, which fires before entity resolution.

## Execution log

| Step | Files | Command | Result |
|---|---|---|---|
| 2.1 REQ-196a body | `spec/02-requirements.md:3243` | `sed -n 3243p \| wc -m` | 783 newline-inclusive (≤800), 6 sentences |
| 2.2 REQ-196a checks | same | `npm run validate:sdd` | 0 errors |
| 2.3 T239 row | `spec/appendices-reference.md:1697` | grep after edit | Player nearest-verb clause removed |
| 2.4 T643 row | `spec/appendices-reference.md:2061` | grep after edit | `xyzzy` → `[FORBIDDEN]` clause + `REQ-309, REQ-196a` citation |
| 2.5 W.3 heading | `spec/appendices-fixtures.md:831` | `grep -c "under Player badge (ruleset-free Novel)"` | 1 |
| 2.6 W.4 | `spec/appendices-fixtures.md:964` | `grep -c "\[NOT_FOUND\]"` / `[UNIMPLEMENTED]` | 0 / 1 |
| 2.7 REQ-196c body | `spec/02-requirements.md:3249` | `sed -n 3249p \| wc -m` | 531 (≤800), 5 sentences |
| 3.1 T643 assertion | `holonovel/scripts/test-competitive-gaps.ts:493-505` | `test:competitive-gaps` | 30 passed, 0 failed |
| 3.2 catalogue harness | — | `test:backfill` | 104 passed, 0 failed |
| 3.3 vocabulary | — | `test:world-provider` | 7 passed, 0 failed |
| 4.1 register resolve | `spec/audit/review-register.md` | `check-registers:strict` | PASS |
| 4.2 register schedule | same | `check-registers:strict` | PASS |
| 4.3 roadmap | `ROADMAP.md` | `check-roadmap` | OK, 17 sections |
| 4.4 changelog | `CHANGELOG.md` | `session:close` subject derivation | new first entry |
| 4.5 coverage register | `spec/audit/req-coverage.md` | `validate -- --write-register` | REQ-196 row now `T239, T261, T313, T643` |
| 5.1 assemble | `holonovel.md`, `holonovel/holonovel.md`, `spec/build-phase-map.md` | `npm run assemble` | wrote all three |
| 5.2 gates | — | `npm run check:fast` | see final run below |

## Deviations

- **Coverage row needed an explicit catalogue citation.** The generator derives
  a REQ's test list from the Appendix F rows that cite it, not from the `_Check:`
  trailer alone: after step 4.5 the REQ-196 row was still `T239, T261, T313`,
  so T643's row citation was widened to `REQ-309, REQ-196a` (the row now asserts
  both contracts). The next regeneration produced `T239, T261, T313, T643`.
  In-plan intent (four citations) preserved; mechanism different from the plan's
  stated expectation.
- **Probe fixture.** The ruleset-bound case could not create a character with
  the minimal seed package (`[INVALID_INPUT]` demanding species/classes). The
  badge gate fires before entity resolution, so the captured refusal is valid;
  the harness's own T643 case (which seeds a character successfully) covers the
  full path and passes.
- **Two roadmap sections replace one.** Net open sections 16 → 17 (closed one,
  added two: P1 observer, P2 tool-name drift).

## Findings and dispositions

- **P0 — none.**
- **P1 — REQ-309h observer clause unimplemented** (predicate
  `holonovel/src/index.ts:4974-4975` → `holonovel/src/core/state.ts:1124-1126`;
  probe recorded `observer` → `[FORBIDDEN]` for `look` and `xyzzy`): `Scheduled-roadmap` as F-5.10-2 with ROADMAP
  § §5.10 observer badge parser access.
- **P2 — §5.10 `command` vs `run_command` tool-name drift** (19 references,
  rename recorded at `holonovel/DECISIONS.md:1507`): scheduled on ROADMAP.
- **P3 — none new.** The probe's character-creation artifact is a fixture
  limitation, recorded above, not a product defect.

## Deployment

`deployed: not applicable — no publication in scope`. The increment stops at
the local commit; `push-pipeline.sh` is a separate, explicitly authorised step.

## Loop status

LOOP PAUSED
