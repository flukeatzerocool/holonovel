# Tasks — verification-surface reachability

Order is dependency-strict: Phase 0 must be green before any wiring step, and the
docs regeneration follows the last manifest edit. The work lands as three commits
(plan § Commit order): red-baseline repair (T1–T4), surface wiring (T5–T9), docs
and close (T10–T14).

| # | Task | Depends on | Verification |
|---|---|---|---|
| T1 | Repoint the 23 stale anchor sites in the five `holosuite-*` tier libraries (S1) | — | the five tier commands exit 0 |
| T1a | Append the per-anchor review table to this file: old line, new line, declaration on the new line, producing `grep -n` (S1) | T1 | every row names a declaration, not a bare symbol hit; ambiguous symbols marked and justified |
| T2 | Reproduce T139 (`test-backfill`) and T-new (`test-narrative`); locate the leaking briefing section | T1 | two failing assertions reproduced with the leaking line named |
| T3 | Fix the Player-surface leak in `holonovel/src/index.ts` (or correct the assertion with a REQ citation) (S2) | T2 | both harnesses exit 0 |
| T4 | Full dry run: `npm --prefix holonovel run test:all` (S3) | T1, T3 | exit 0, every command passes, wall time recorded |
| — | **Commit 1 — red-baseline repair** (primary path: T1–T4; fallback path: T1–T1a only) | T4 (or T1a on the fallback path) | primary: `test:all` exits 0; fallback: five tier commands exit 0 and `test:all` shows exactly the two known failures |
| T5 | Add `test:all`, `test:loop-artifacts`, `test:holosuite-mutation`; remove `playability`; add the two root delegators (S4) | T4 | `npm run gates -- --list` shows the three new rows and no `playability` row |
| T6 | Add `protected` to `Gate`, enforce it in `retiredGates()`, exclude protected gates from candidates, fix the cost-report header count (S5) | T5 | after one full `check`: `npm run gate-cost -- --threshold 1 --json` has a `test:all` row and no protected gate in `candidates`; a temporary retirement entry naming `test:all` leaves it non-advisory |
| T7 | Change `test-loop-artifacts.ts` role header to `[gate]` and drop the "not wired" note (S6) | T5 | `npm run check-script-discipline` |
| T8 | Remove the three subsumed CI steps (S7) | T5 | `npm run check-workflows`; job read-through |
| T9 | Remove the two subsumed pre-push blocks (S8) | T5 | `bash -n .githooks/pre-push`; `check-script-discipline`; `--recorded` round trip |
| T10 | Regenerate the `AGENTS.md` gate table and add the cost sentence (S9) | T5–T9 | `npm run check-gate-table` |
| T11 | Update `playtest/README.md` and `holosuite.ts` gate-status prose (S10) | T5 | `npm run lint` and a re-read against the manifest |
| T12 | `npm run check:fast`, then `npm run check` (requires `aar.md` to already carry a LOOP token) | T10, T11 | both PASS on the final tree |
| — | **Commit 2 — surface wiring** (T5–T9) | T9 | full `check` PASS recorded before the commit |
| T13 | Remove the roadmap section; write the CHANGELOG entry (S11) | T12 | `npm run check-roadmap` |
| T14 | Rewrite `aar.md`; close with `npm run session:close` (commit 3) | T13 | AAR ends `LOOP PAUSED`; commit lands |

## Anchor repoint review (T1a)

Every site repointed in T1, with the line that now carries the symbol and the
declaration found there. `git diff` on the five files shows only line numbers
changing; no symbol string was edited.

| Tier | Old line | New line | Declaration on the new line |
|---|---|---|---|
| conformance | `:200` | `:201` | `const TOOL_ANNOTATIONS: Record<string, ToolAnnotation> = {` |
| conformance | `:2617` | `:2641` | `const handle = server.registerResource(key, uri, …)` (resource registration helper) |
| conformance | `:1669` | `:17460` | `server.prompt("intro", …)` (first prompt registration; `:17456` before the S2 `badge_scope` edit moved it four lines) |
| conformance | `:1640` | `:1877` | `function surfaceProfile(): "full" | "standard" | "small"` |
| conformance | `:3393` | `:3417` | `function err(code, msg, correctiveAction?)` |
| invariants | `:4631` | `:4655` | `server.registerTool("manage_history", …)` |
| invariants | `:683` | `:684` | `const pacingSessions = new Map<string, PacingSession>()` |
| invariants | `:11624` | `:11652` | `function replayInspection(novel, requested?)` |
| invariants | `:12322` | `:12350` | `case "context_report":` (REQ-606 ledger) |
| invariants | `:2959` | `:2961` | `saveNovel(novel: NovelState): void {` |
| novel | `:12322` | `:12350` | `case "context_report":` |
| novel | `:12343` | `:12371` | `case "visibility_check":` |
| novel | `:10338` | `:10366` | `if (args.action === "knowledge_query")` |
| novel | `:13129` | `:13157` | `function computeBundleIntegrity(bundle, novel)` |
| novel | `:12068` | `:12096` | `case "recap":` |
| novel | `:2959` | `:2961` | `saveNovel(novel: NovelState): void {` |
| adversarial | `:6587` | `:6611` | `case "create_room":` |
| adversarial | `:11503` | `:12406` | `case "verify":` — the manage_diagnostics branch (REQ-603/605), not the subjective-memory `verify`; resolved by content, since `verify` appears in four handlers |
| adversarial | `:14145` | `:14175` | `function inboxSourcePath(source)` |
| adversarial | `:13212` | `:14150` | `pickParams(MANAGE_NOVEL_SCHEMA, [… "share" …])` |
| adversarial | `:12068` | `:12096` | `case "recap":` |
| adversarial | `:13412` | `:13440` | `const strictMode = args.strict === true` |
| differential | `:2959` | `:2961` | `saveNovel(novel: NovelState): void {` |

Ambiguous symbols and their resolution: `verify` → the diagnostics action
branch (the anchor's finding class is REQ-603 state verification); `prompt` →
the first `server.prompt` registration; `share` → the `pickParams` export list
that names the argument; `err` → the helper's definition; `recap` → the
`handleContextTool` recap branch. `saveNovel` moved by three lines only
(`:2959`→`:2961`); an earlier fix used `:2962` and the tier reported
`line 2962 does not contain 'saveNovel'`, which is the predicate catching the
off-by-one.

Sites below `holonovel/src/index.ts:8634` shifted four lines when the S2
`badge_scope` fix added its schema line, comment, destructure entry, and set
property; the table records the post-S2 lines, and the five tiers were re-run
green on that final tree.

## Stop rule

If T2 exposes a leak that needs more than one renderer site or a cross-module
change, stop after T1a: commit 1 (the anchor repair) lands on its fallback gate
(five tier commands exit 0; `test:all` reports exactly the two known failures,
T139 and T-new, and nothing else), the wiring (T5–T11) stays unexecuted,
`ROADMAP.md` keeps a narrowed section naming the two failing assertions, the AAR
records why, and the increment closes `LOOP PAUSED` (plan C-1). A red suite is
never wired blocking.
