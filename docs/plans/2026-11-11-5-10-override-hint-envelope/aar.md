# After-action report — §5.10 override hint envelope and REQ-325c Check

Date: 2026-11-11 · Plan: `plan.md` (sha256 3198da33…) · Kind: planned · Depth:
standard · Independence: fresh · Rollback cost: 1

## Objective and outcome

Closed F-5.10-1. `run_command (action: resolve)` no longer reports arrival
through a closed or locked door: the result is `blocked` with the constraint
class, the reason, and — only when the catalog offers one — the override hint
`Knock (1 slot remaining) can open it.` Hint matching keys on the entry's
`type` constraint class instead of comparing the mechanic name to the door.
REQ-325c cites T370 and T372 (T369 was the vow-countdown row), REQ-326d cites
T373, and the Appendix F T370 row asserts the blocked envelope and the
GM-breadth clause. Status: done as planned; one deviation recorded below.

## Baseline

- `npm run status`: 48 unpushed commits, 15 open roadmap items, v2026.11.11.
- `npm run check:fast`: 40/40, `check:fast: PASS`, exit 0.
- `test:output-contracts` 385/0; `test:backfill` 104/0; `check-registers` PASS.
- `git status --porcelain`: clean.

## Red test (recorded before the fix)

`npm --prefix holonovel run test:output-contracts` →

```
FAIL T370/REQ-323 + REQ-325: resolve blocks a closed door and emits override hints: REQ-325b hint text wrong: []
387 passed, 1 failed
```

The widened T372 assertions passed pre-fix as the plan predicted (contract
catch-up, not a behavior fix).

## What went right

- The red test isolated exactly one behaviour: the door override produced no
  hint because the scan compared the mechanic name to the door name.
- The shared `visibleConstraintOverrides` predicate kept the resource
  behaviour-neutral; T372 proves the Player filter and the GM counts unchanged.
- The GM-breadth reading (REQ-325c's GM clause) is now pinned by a foreign
  entity's override appearing in the hint list, resolving the clause tension
  instead of silently narrowing it.

## What went wrong / deviations

- **Blast-radius omission (generated).** `spec/build-phase-map.md` changed
  because `npm run assemble` rewrites its content hash (REQ-278). It is a
  generated artifact, not an orphan hand edit; recorded here.
- **`test:all` is not green, and was not green before this change.** The plan's
  verification listed `test:all` as exit 0; the pre-change tree already failed
  six harnesses. Per build-review §0.5 the failures are recorded, not counted
  against the increment:
  - `test:holosuite-{conformance,invariants,novel,adversarial,differential}` —
    27 `predicate_unresolved` findings. Every cited
    `path:line#symbol` was checked with `git show HEAD:<path>`; all are stale at
    HEAD, none in files this increment edits (`parser.ts`, `model.ts`,
    `state.ts`, and stale `index.ts` anchors were already wrong before the
    edit). Owned by `ROADMAP.md` Holosuite anchor repoint automation (P2); its
    trigger ("the next `index.ts`/`state.ts` edit that drifts a predicate")
    fired with the previous increment.
  - `test:pattern-buffer` I1 — `command(xyzzy)` returns
    `[ERROR] [UNIMPLEMENTED] Unknown verb 'xyzzy'. Valid commands include:
    ask, climb, close.` while the harness expects "not a recognized command"
    (`holonovel/scripts/run_pattern_buffer.ts:243`). REQ-196c mandates the
    implementation's text; Appendix W's golden transcript shows the harness's.
    Pre-existing spec-vs-transcript conflict, now scheduled as a P1 ROADMAP
    item; not fixed here because it changes a normative refusal contract.

## Findings and dispositions

- **P0 — none.** No new gate failure and no demonstrated wrong output from this
  change; the targeted harnesses, `check:fast`, `check`, and `build-order` pass.
- **P1 — pattern-buffer I1 refusal conflict (pre-existing).**
  `Scheduled-roadmap`: new `ROADMAP.md` § Pattern-buffer I1 verb-refusal
  expectation (P1).
- **P1 — stale holosuite evidence anchors (pre-existing).** Already
  `Scheduled-roadmap` under Holosuite anchor repoint automation (P2); the
  trigger fired. Anchors were not repointed here: many symbols are ambiguous
  (`err`, `recap`, `registerResource`, `share` have 5–76 candidate lines) and
  the roadmap item forbids guessing.
- **P3 — proofread register drift.** Live pass reports 282 warnings against 271
  recorded; pre-existing and unchanged by this increment.
- **Closed-P3 (register).** REQ-325c's unreachable Player-badge hint clause, the
  four harness label corrections (T371 builder-side gap, T373/T374, T376,
  T377), and REQ-323a's dangling Appendix O pointer.

## Verification

| Step | Command | Result |
|---|---|---|
| Targeted harness | `npm --prefix holonovel run test:output-contracts` | 390 passed, 0 failed |
| Targeted harness | `npm --prefix holonovel run test:backfill` | 104 passed, 0 failed |
| Server suite | `npm --prefix holonovel run test:all` | 50 passed, 6 failed — all pre-existing, diagnosed above |
| Spec assembly | `npm run assemble` | wrote `holonovel.md`, `holonovel/holonovel.md`, phase-map hash |
| Register | `npm run validate -- --write-register` | 0 errors; REQ-325 `T370, T372`, REQ-326 `T373`, REQ-324 E |
| Strict validation | `npm run validate -- --sdd-strict` (inside `check`) | 0 errors |
| Fast gates | `npm run check:fast` | 40 passed, 0 failed, `check:fast: PASS` |
| Full gates | `npm run check` | `check: PASS` |
| Pipeline | `npm run build-order` | complete, versions 2026.11.11 unchanged |

## Plan-review conditions

- **C-1 (GM hint breadth).** Verified: T370 asserts `Passwall` (foreign entity)
  appears under the Game Master badge alongside `Knock`, and D4/D8 record the
  REQ-325c reading.
- **C-2 (labels + Closed-P3).** Verified: four titles corrected; the register's
  `## Closed-P3` entry names the unreachable clause, the corrections, and the
  Appendix O pointer.
- **C-indep.** Cold pass present (`independent-review.md`, sha256 2fcf94fc…,
  5 areas); no risk acceptance needed.

LOOP OPEN — the increment's own contract is closed, but `test:all` stays red on
two scheduled pre-existing items: the holosuite anchor repoint (P2, trigger
fired) and the pattern-buffer verb-refusal conflict (P1).
