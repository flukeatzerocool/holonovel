# AAR — §5.10 parser response and help contracts

Date: 2026-11-10 · Increment: `docs/plans/2026-11-10-5-10-parser-help-remediation/`
Outcome: closed · Plan: approved (plan-review passed, fresh cold pass, condition
C-1 verified below)

## 1. What landed

| Item | Result |
|---|---|
| F-P6a-7 — parser response and help contracts | Resolved; register row carries post-change predicates |
| F-P6a-11 — narrative-intent verbs | Resolved |
| F-P6a-17 — narrative-verb NPC scope | Resolved (re-disposed from `Closed-P3`) |
| `ROADMAP.md` §5.10 | first bullet retired; two bullets remain with an F-P6a-8/9/10/12/13/14 closing condition |
| REQ-002a1 / REQ-002a2 / REQ-002b1 + Appendix O.2 | amended for the parser-vocabulary `[UNIMPLEMENTED]` (D12) |

## 2. Done bar

1. **Met.** Three findings under `## Resolved — 2026-11-10 §5.10 parser and help
   contracts`, each with a `file:line` predicate; every covered REQ named.
2. **Met.** `npm run check-roadmap` passes; the section keeps two bullets and a
   `**Trigger:**` naming the six remaining findings.
3. **Met.** Pre-fix red recorded (§3); post-fix `test:backfill` 102/102,
   `test:output-contracts` 361/361, `test:world-provider` 6/6, `test:adventure`
   and `test:narrative` pass.
4. **Met.** REQ-002a1 613 chars, REQ-002a2 424, REQ-002b1 551 (limit 800);
   `npm run validate --sdd-strict` reports 0 errors.
5. **Met.** `check-world-provider` fresh; the provider document is
   byte-deterministic.
6. **Met.** `npm run assemble`; `check:fast` 40/40 with `check:fast: PASS`;
   `build-order` reports 0 errors for the full gate.
7. **Met.** `check-tool-definitions-sync`, `tool-definitions-lint`,
   `check-tdqs-scoreboard`, `surface-budget` all pass after regeneration.
8. **Met.** `validate -- --write-register` refreshed the coverage register;
   `check-registers` passes.
9. **Met.** This file ends `LOOP PAUSED`; one commit via `session:close`.

## 3. Red-test record

Pre-fix run (source at `HEAD`, new assertions in place):

- `test-output-contracts` — 359 passed, 2 failed:
  - `REQ-196d help category: expected to contain "navigation" but got:` (old
    help rendered tiers only)
  - `REQ-196d help description: expected to contain "Pick up a portable thing" but got:`
- `test-backfill` — reached T266, killed after 25 min:
  - `T239/REQ-196: expected to contain "[UNIMPLEMENTED]", got: [ERROR] [NOT_FOUND] "xyzzy" is not a recognized command.`
  - `T365/REQ-320: expected to contain "[WARNING]", got: [OK] You throw the stone at cellarkeeper.`
- `test-world-provider` — compile-level red before implementation:
  `SyntaxError: The requested module '../src/world/model.js' does not provide an
  export named 'READONLY_VERBS'`.

The pre-fix backfill run did not reach its summary: T266's restart path left the
harness waiting after the killed server. The two behavioral failures above are
the evidence the bar requires; the post-fix run completes 102/102.

## 4. Deviations and surprises

- **Ambiguity side effects (fixed in-session).** The first implementation
  returned the disambiguation prompt with `prefix: "OK"`, so the handler's
  take/drop/open side effects ran on the prompt itself: the ambiguous `take
  altar` silently moved `stone altar` into inventory before the caller picked a
  match. Fixed by gating every OK side-effect block on
  `okAction = prefix === "OK" && !result.disambiguation`
  (`holonovel/src/index.ts:5021`). This is the D5 contract made executable; no
  plan amendment was needed.
- **Test-state coupling (fixed in-session).** The new T365 block switched the
  active Novel to `bf2`, displacing `bf4` that the following workflow-staleness
  test (T266) depends on. The block now restores `bf4`. The coupling is recorded
  as a P3 finding below.
- **Host restart during the red run.** The pre-fix run was launched under
  `git stash`; the host restarted mid-run and left the source stashed. The stash
  was popped immediately (verified byte-identical to the backup copies), and the
  red run was repeated with file backups and a trap-based restore instead of a
  stash.
- **T363 → T245 (planned).** The `read_text` catalog assertion lands in
  `test-world-provider.ts` (T245), not T363; T363 stays the convert-property row.

## 5. Findings and dispositions

- **P3 — T266 depends on the ambient active Novel (recorded, no action).**
  Predicate: `holonovel/scripts/test-backfill.ts:891-909` creates a pending
  workflow on whatever Novel is active, then asserts it on `bf4`. Any preceding
  test that changes the active Novel without restoring it breaks the assertion.
  Demonstrated only in the pre-fix ordering; the post-fix run passes. Recorded
  here per the P3 rule (informational, no scheduled action, no product failure).
- **No new P0/P1/P2 findings.** The REQ-002a1/a2/b1 taxonomy conflict was
  resolved in-plan by D12 rather than deferred.

## 6. Verification evidence

| Command | Result |
|---|---|
| `npm run check:fast` (un-piped) | 40 passed, 0 failed, `check:fast: PASS` |
| `npm run build-order` | exit 0; full `check` 0 errors, 285 warnings; version sync OK; fingerprint propagated |
| `npm run validate -- --sdd-strict` | 0 errors |
| `npm run check:conformance` | PASS, 0 bundle-dependent REQs |
| `npm run check-world-provider` | fresh |
| `generate-tool-definitions --check` | in sync (37 tools) |
| `tool-definitions-lint` | 0 violations |
| `check-tdqs-scoreboard` | conforms |
| `surface-budget` | PASS — full 28,472 / standard 24,873 / small 1,180 |
| `npm --prefix holonovel run test:backfill` | 102 passed, 0 failed |
| `npm --prefix holonovel run test:output-contracts` | 361 passed, 0 failed |
| `npm --prefix holonovel run test:world-provider` | 6 passed, 0 failed |
| `npm --prefix holonovel run test:adventure` | pass |
| `npm --prefix holonovel run test:narrative` | pass |
| root + server `typecheck` | exit 0 |

## 7. Condition C-1 (build-review)

C-1 asked build-review to confirm the three propagation edits are the only delta
since the reviewed plan artifact. Confirmed: the plan's D12 lists four edits,
the blast-radius row says three sub-REQ bodies, and the body-budget risk line
names all three pre-edit counts (497 / 324 / 445). The only later plan edits are
the execution checkbox updates in `tasks.md`.

LOOP PAUSED
