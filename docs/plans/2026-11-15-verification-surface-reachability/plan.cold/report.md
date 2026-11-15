# Cold review — verification-surface reachability

Reviewer: DeepSeek V4.1 Flash (cold pass, no authoring context)
Plan sha256: b28b3fc3c292267df4210c660ce1f3124f54d2ebef45deb95c369a49eaa94be5
Target: docs/plans/2026-11-15-verification-surface-reachability/plan.md
Companion: tasks.md (same increment)
Depth: standard · Budget 40 · Reads used 31
Independence: fresh (no parent findings, no evidence-sidecar conclusions)
Note: artifact hash recorded as dispatched; it could not be recomputed (read-only dispatch, shell denied).

## Stage results

| Stage | Result | Basis |
|---|---|---|
| 1 — completeness | PASS | No blocker. Paraphrase (comprehension): wire the 56-command server suite (`test:all`), the `test-loop-artifacts` self-test, and the report-only mutation tier into gates; make `test:all` blocking by first repairing 19 stale Holosuite anchors and two Player-surface leaks; remove now-duplicate surfaces (playability gate, CI steps, pre-push blocks); regenerate the gate table and close the roadmap item. "Done" = suite green, `check:fast` and `check` green, three harnesses surfaced, roadmap section removed, AAR `LOOP PAUSED`. Faithful, with the caveat that the fallback path has no bar (M2). |
| 2 — scope / blast radius | PASS | 19 files enumerated and plausible; scope gap on dedupe and the publish path (M1) and two stale-doc surfaces (N5). |
| 3 — assets / dependencies | FAIL | B1 (Phase 0 command does not exist), B3 (gate command for `test:holosuite-mutation` unspecified and unrunnable), M6 (blocking gate wired without a green baseline), M7 (T12 ordered before the AAR the gate requires). |
| 4 — verification / rollback | FAIL | B2 (acceptance command wrong, expected output unsatisfiable), M3 (rollback cost overstated; baseline folded into feature commit), M4 (anchor verification cannot detect a wrong repoint), M5 (`protected` not enforced at consumption). |
| 5 — clarity / readiness | FAIL | Three acceptance criteria cannot be implemented or checked as written (B1–B3); anchor count reads as six for five sites (N3). |

## Findings (severity-ranked)

### [Blocker] [design] Phase 0's dry run invokes a script that does not exist yet
`plan.md:114` and `tasks.md:11` require `npm run test:all` **from the repo root** before any wiring; the root `package.json` (lines 6–92) has no `test:all` script — it is added only by S4/T5 (`plan.md:126-128`, `tasks.md:12`). The only definition is `holonovel/package.json:120`. EV5's "`test:all` at HEAD" (`plan.md:37`) must therefore have been `npm --prefix holonovel run test:all`, which the plan never says. As written the Phase 0 gate fails on a missing script.
Must change: state the Phase 0 command as `npm --prefix holonovel run test:all`, or move the root delegator ahead of Phase 0 and say so.

### [Blocker] [design] S5's acceptance criterion is unrunnable and its expected output cannot occur
`plan.md:132-133` and `tasks.md:13` use `npm run gate-cost-report -- --threshold 1 --json`. The root script is `gate-cost` (`package.json:86`); `gate-cost-report` is only a filename. Additionally, rows are derived solely from `.holonovel-state/gate-timing.json` (`gate-cost-report.ts:61-99`), so a newly added gate has no row until it has run, and a full-only gate with no recorded run can never be a candidate. "lists every other gate as a candidate and `test:all` / `test:loop-artifacts` as none" is not satisfiable.
Must change: use `npm run gate-cost -- --threshold 1 --json`, require a recorded full run first, and state the expected JSON predicate (protected gates absent from `candidates`).

### [Blocker] [design] The manifest command for `test:holosuite-mutation` is unspecified and has no runnable target
`plan.md:125-126` adds the gate with `fast`/`full`/`advisory` but no command; the blast radius adds only the `test:all` root delegator (`plan.md:181`). Root `package.json` has no `test:holosuite-mutation`; the only definition is `holonovel/package.json:129`. An implementer must invent either a new root script or the `["npm","--prefix","holonovel","run",…]` form used at `gate-manifest.ts:221-222` — a decision the plan leaves open for one of its three headline harnesses.
Must change: name the exact command array and, if a root delegator is used, add it to the blast-radius `package.json` row.

### [Major] [design] "Dedupe at wiring time" is incomplete — three existing gates and the publish step re-run `test:all` content
`run-test-suite.ts:38` (`test:data-dir`), `:49` (`test:world-provider`) and `:80` (`check:vendor`) duplicate `gate-manifest.ts:80-85`, `:74-79` and `:218-223`. `scripts/publish/steps.ts:352` runs `test:all` a second time whenever the full check already ran in build-order (`steps.ts:248-257`). No coverage is lost, but every full `check` runs those three commands twice and the publish path can run the 172 s suite twice — the same argument D2 and the alternatives section (`plan.md:56-59`, `229-231`) use to remove `playability`. EV2 (`plan.md:34`) is cited and then never acted on.

### [Major] [clarity] Phase 0's stop rule has no completion bar and contradicts the primary bar
`plan.md:207-212` stops after S1, leaves the wiring unexecuted, and adds a new dated ROADMAP entry; `plan.md:192-203` requires the wiring (items 1–5) and requires "ROADMAP.md no longer carries the section" (item 6), while S11 (`plan.md:165-166`) deletes that section unconditionally. `tasks.md:23-28` repeats the fallback without its own bar. A reader cannot tell what "done" means on the fallback path.
Must change: state the fallback's bar (e.g. T1 committed, roadmap entry added, AAR `LOOP PAUSED`) and make S11/T13 conditional on the primary path.

### [Major] [design] The red baseline is folded into the feature commit, and rollback cost 1 is overstated
`plan.md:6-8` claims one revert restores Phase 0 and Phase 1–2 together. AGENTS.md's Agent Operating Routine says a red baseline is "fixed first, as its own commit, never folded into the feature work", and the split-limits rule splits a non-spec session by concern (≤5 commits). The stated rollback cost therefore does not hold, and the increment violates a standing rule it does not acknowledge. Also "the five tier anchors" (`plan.md:6`) is 19 unique anchors / 23 sites (`plan.md:86`).

### [Major] [design] Anchor-repoint verification proves resolvability, not correctness
`plan.md:99-100` verifies only that the five tier commands exit 0, while `plan.md:95-97` itself warns that `err`, `prompt`, `share` and `verify` must be resolved by content context. The observed predicate check is "line does not contain '<symbol>'", "is a comment", "is a closing delimiter" (`/tmp/opencode/testall.log:154-158`, `167-171`, `180-185`, `194-199`, `208`), so *any* line containing `err` passes. A repoint to the wrong `err` is green and the plan cannot tell.
Must change: add a per-anchor content assertion (symbol + the enclosing block the finding class describes) or a mandatory per-anchor diff review of all 19.

### [Major] [design] `protected` is not enforced where retirement is consumed
`plan.md:67-72` claims a green streak "cannot silently convert a §8 workflow into advice". The only consumer change is the candidate filter (`gate-cost-report.ts:95`); `gate-manifest.ts:297-312` applies `RETIRED` with no `protected` check, so an existing or hand-added `spec/audit/gate-retirement.json` entry still downgrades a protected gate. The mechanism is a one-way guard.
Must change: have `retiredGates()` ignore (and warn on) protected names, or narrow the claim to the `--apply` path.

### [Major] [design] `test:loop-artifacts` is made blocking with no recorded green baseline
`plan.md:63-66` asserts it "costs 0.4 s" and makes it a blocking fast gate. EV4 (`plan.md:36`) cites only its header (`test-loop-artifacts.ts:1-13`); no evidence row records a run. If it is red at HEAD, T12 fails and C-1's stop rule (`plan.md:207-212`) covers only S2. Same for the cost figure.

### [Major] [design] T12 runs the full gate before the AAR the gate requires
`tasks.md:19-21` runs `check:fast`/`check` at T12 and writes `aar.md` at T14. `scripts/lib/loop-artifacts.ts:71-80` makes a missing `aar.md` and a missing LOOP token errors, and `check-loop-artifacts` is fast+full (`gate-manifest.ts:273-278`). The directory does contain `aar.md`, but the plan never states that the T12 run depends on it already carrying a terminal token.
Must change: state the precondition, or move the AAR write ahead of T12.

### [Nit] [clarity] `plan.md` has no machine-read `**Done bar:**` line
The contract regex is `/\*\*Done bar:?\*\*/i` (`scripts/lib/loop-artifacts.ts:45`); `plan.md:192` uses a `## Done bar` heading. `docs/plans/README.md:31` asks for a "Done bar line". This emits a permanent warning from the gate the plan is strengthening.

### [Nit] [clarity] REQ-141m is cited for the role-header rule
`plan.md:66` cites REQ-141m. That REQ is "Harness fail-loud" (`spec/03-build.md:1353`): non-zero exit when a spawned process terminates unexpectedly. It does not govern role headers; the role-header rule is AGENTS.md script discipline.

### [Nit] [clarity] The conformance anchor count reads as six for five sites
`plan.md:87-88` names "`:35`, `:36`, `:170`, plus the `prompt`/`surfaceProfile`/`err` anchors". The five anchors are `holosuite-conformance.ts:35` (TOOL_ANNOTATIONS), `:36` (registerResource), `:37` (prompt), `:170` (surfaceProfile), `:192` (err): `surfaceProfile` is counted twice and `:37` is omitted.

### [Nit] [design] The mutation gate can never fail, so `advisory` is inert
`holosuite.ts:179-181` skips mutation-tier findings, so `--tier=mutation` always exits 0. The gate adds visibility only; `gate-cost-report` will also mark it a permanent candidate (zero failures forever, `gate-cost-report.ts:95`) unless protected. One sentence in S4 should say the gate is visibility-only.

### [Nit] [clarity] `gate-cost-report.ts`'s own header count goes stale
`gate-cost-report.ts:5-6` says "the gate manifest from 26 to 32". S5 already edits this file; the header is not in the blast radius.

## Answers to the dispatched checks

- **(a) 56 commands / 49-7 / 19 unique anchors — CONFIRMED.** `/tmp/opencode/testall.log:5` ("56 commands, concurrency 4"), `:211` ("49 passed, 7 failed (171.9s wall clock)"), `:213` (WALL 172.09 s). 23 `predicate_unresolved` findings (`:154-158`, `:167-171`, `:180-185`, `:194-199`, `:208`) reduce to 19 unique `path:line#symbol` anchors; per-file site counts 5/5/6/6/1 match `plan.md:172-176`. EV7's sample lines are real (`index.ts:201` `TOOL_ANNOTATIONS`, `:684` `pacingSessions`, `:2641` `registerResource`).
- **(b) Coverage vs double-run.** No coverage gap. `check-playability` (`package.json:45`, `--all`) is a strict subset of `test:playability` (`holonovel/package.json:130`, `--all --self-test`; `playability.ts:245`), so removing the gate loses nothing. Every removed CI command is either in `TESTS` (`run-test-suite.ts:25-82`) or an existing manifest gate (`check-starter-freshness`); the removed pre-push blocks sit inside the `suite_ran=false` branch that then runs `npm run check` (`pre-push:100-124`), which carries the suite. Double-runs do exist: see M1.
- **(c) Protected-gate mechanism.** Feasible (one optional field plus a name set), but not verifiable as specified (B2) and not enforced at the point retirement is applied (M5).
- **(d) Done bar / stop rule.** The primary bar is not satisfiable as written (B1, B2, B3, M7); the stop rule is unsound as a second terminal state (M2) and is the only fallback (no path for a red `test:loop-artifacts`).
- **(e) Omitted files.** Root `package.json` needs the `test:holosuite-mutation` target or an explicit prefix command (B3); `scripts/publish/steps.ts` is cited by EV2 but absent from the blast radius (M1); `scripts/lib/gate-manifest.ts`'s retirement consumption needs the `protected` check (M5); `gate-cost-report.ts` header (N5). No other file must change for the plan's steps: the `playability` gate name is not hardcoded outside the manifest (grep over `scripts/**/*.ts`), and §8 does not name it (`spec/05-verification.md` has no `playability` reference).

## Unknowns

1. I could not execute commands (shell denied), so the current pass state of `scripts/test-loop-artifacts.ts` and the current `check:fast` result are unverified (M6).
2. `aar.md` exists in the increment directory; it was not read (outside the handed artifact set), so its LOOP token state is unknown (M7).
3. The artifact bytes could not be hashed in this dispatch; the dispatched sha256 is recorded above.
4. Whether any REQ names the `playability` gate: I checked §8 and `scripts/`, not the full REQ corpus. Coverage is retained either way.

## Reads used

plan.md; tasks.md; plan.evidence.md; increment directory listing; AGENTS.md (injected); holonovel/AGENTS.md (injected); scripts/lib/gate-manifest.ts; scripts/gate-cost-report.ts; scripts/check-gate-table.ts; scripts/lib/loop-artifacts.ts; scripts/check-loop-artifacts.ts; scripts/test-loop-artifacts.ts; scripts/publish/steps.ts (310-369 + grep); package.json; holonovel/package.json (grep); holonovel/scripts/run-test-suite.ts; holonovel/scripts/holosuite.ts (1-40 + grep); holonovel/scripts/lib/holosuite-mutation.ts (1-30); holonovel/scripts/lib/holosuite-conformance.ts (grep); holonovel/scripts/playability.ts (grep); holonovel/src/index.ts (grep); .github/workflows/ci.yml; .githooks/pre-push; spec/05-verification.md (180-269 + grep); spec REQ-141m grep; ROADMAP.md (1-115); docs/plans/README.md; /tmp/opencode/testall.log (2 greps). 31/40.

---

# Final targeted confirmation (after the re-review cap)

Scope: the four amendments made after the targeted re-review — the commit-1
fallback gate in `## Commit order`, C-1's pointer to it, `tasks.md`'s commit-1
row and stop rule, and EV18 plus the Question 3 sentence. Reads used: 4.

Verdict: `independent-review passed.`

- Fallback commit-1 gate: consistent across `plan.md` and `tasks.md` and
  satisfiable (a negative assertion on a red suite, with S1 clearing the five
  anchor failures and leaving exactly T139 and T-new).
- EV18: supported by the cited increment (`test:all` 49/7 → 56/0, and the
  27-anchor P3 recorded in that AAR).
- No new internal contradiction.

Nits raised (all fixed in the reviewed plan after this check): label the two
commit-1 gates explicitly; "seven-command" not "seven-suite"; resolve EV18's
source cell to `docs/plans/2026-11-13-server-suite-reds/plan.md:26`.

---

# Execution delta review (D-1)

Scope: the `### Execution delta (D-1)`, amended S2, and the amended blast-radius
rows. Reads used: 9.

Verdict on first pass: `independent-review FAILED.` — the technical claim, the
REQ backing, the blast-radius coverage, and the S2 ceiling all held; one Major
and three minor findings were wording/drift ("now committed" while the worktree
was dirty; "blast radius above"; C-1 still describing S2 as unbounded; the
REQ-073c2 citation instead of REQ-073c1/c2).

Fixes applied: the artifacts are described as applied to the working tree and
carried by commit 1; the cross-reference is "Blast radius section"; C-1 records
that S2 stayed inside its ceiling and the fallback is conditional on a later
revision exceeding three edits; the citation is REQ-073c1/073c2.

Narrow confirmation (4 reads): `independent-review passed.` — all four fixes
verified and no residual claim that the artifacts are committed.
