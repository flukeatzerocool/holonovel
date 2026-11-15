# Plan — Verification-surface reachability (ROADMAP P1 #1)

Status: draft v5 (execution delta D-1: the two leaks were a missing
`badge_scope` setter and an over-broad assertion, not a renderer filter; the
regenerated surface artifacts are now in the blast radius) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-15-verification-surface-reachability/`
Rollback cost: 1 (three reversible commits: the red-baseline repair, the
surface wiring, and the docs/roadmap close — each reverts on its own)
Evidence class: repo and tool-output. Every premise below is a `file:line` read
at HEAD `4811c7d` or a command run in this session; the suite run is recorded in
`/tmp/opencode/testall.log`.
Trust boundary: repo and local tool output only. No web, user, or fetched
content enters this plan.
Review independence: fresh — cold pass recorded in `plan.cold/report.md`, whose
hash the stamp records.

## Resolutions (cold pass → v3)

- **B-1 — Phase 0 named a script that does not exist yet.** S3 and T4 now run
  `npm --prefix holonovel run test:all`; the root delegator arrives in S4. EV5
  records the same command.
- **B-2 — S5's acceptance command was wrong and its output impossible.** S5/T6
  now use `npm run gate-cost -- --threshold 1 --json`, require a recorded full
  run first (EV16), and assert the predicate "no protected gate in `candidates`"
  rather than a list of every other gate.
- **B-3 — the mutation gate had no command.** S4 names it
  `npm("test:holosuite-mutation")` and adds the root delegator; the blast-radius
  `package.json` row now carries both delegators.
- **M-1 — dedupe was incomplete and unstated.** D2 now separates the strict
  duplicates (removed) from the fast-mode gates kept on purpose (≤3 s duplicated
  inside a full run) and records the publish pipeline's second suite run as
  accepted, with the alternative rejected.
- **M-2 — the fallback had no bar.** C-1 now states the fallback done bar, and
  S11/T13 are conditional on the primary path.
- **M-3 — the red baseline was folded in and rollback was overstated.** The
  increment now lands as three commits (`## Commit order`); the red-baseline
  repair is commit 1, as the Agent Operating Routine requires.
- **M-4 — anchor verification proved resolvability, not correctness.** S1/T1a
  add a per-anchor review table (old line, new line, declaration, producing
  `grep -n`), with ambiguous symbols justified.
- **M-5 — `protected` was only enforced in the report.** D5/S5 now also make
  `retiredGates()` ignore a protected name, with a warning.
- **M-6 — `test:loop-artifacts` had no baseline.** EV15 records the HEAD run
  (`passed.`, 0.42 s).
- **M-7 — the full gate ran before the AAR it needs.** Done bar item 7 and T12
  state the precondition: `aar.md` exists with a token before any gate run.
- **N-1..N-5** — the machine-read `**Done bar:**` line is present; the REQ-141m
  citation is replaced by the AGENTS script-discipline reference; the
  conformance site list is corrected to `:35`, `:36`, `:37`, `:170`, `:192`; the
  mutation gate is marked visibility-only and protected; the cost-report header
  count is in S5's scope.

### Targeted re-review (12 calls)

- **R-1 [Major] — the fallback path's commit 1 had no passing gate.** All three
  Blockers and eight of nine Majors were confirmed resolved. The residual: on the
  C-1 fallback the two harnesses stay red, so commit 1's stated gate could not
  pass, and `tasks.md` described commit 1 two ways. Fixed: `## Commit order`,
  C-1, and `tasks.md` now state the fallback gate (five tier commands exit 0;
  `test:all` shows exactly the two known failures) and mark the T-range
  conditional. Re-review cap reached, so this last fix is condition C-5.
- **R-2, R-3 [Nits]** — the ≈2.7 s duplication figure is now attributed to the
  measured suite log (EV5) instead of EV13, and the permanent-candidate claim
  cites `scripts/gate-cost-report.ts:95` instead of EV16.

### Final targeted confirmation (4 reads)

`independent-review passed.` The three amendments (fallback gate symmetry, EV18
support, no new contradiction) all hold; its three nits are fixed above —
commit 1 now labels **Primary gate** and **Fallback gate** explicitly, EV18 says
"seven-command red", and its source cell resolves to
`docs/plans/2026-11-13-server-suite-reds/plan.md:26`.

### Execution delta (D-1, recorded before the fix landed)

Both failing assertions reproduced, and the root cause differed from the plan's
working assumption (a renderer filter). `manage_countdown (action: set)` did not
declare or persist `badge_scope`, so a GM-only clock was stored as shared and
the correct Player filter had nothing to filter; the `test-narrative` assertion
was broader than REQ-281b. The delta is written into S2 and the Blast radius
section, and the regenerated surface artifacts are applied to the working tree —
they ship in commit 1 (red-baseline repair), not as separate commits.

## Questions

1. **Which roadmap item is next?** `ROADMAP.md:15-32` — *Verification-surface
   reachability (P1)*, the first open item after the U4 session closed
   (`docs/plans/2026-11-15-unscoped-u4/aar.md` ends `LOOP PAUSED`).
2. **What does it owe?** Its `**Trigger:**` (`ROADMAP.md:30-32`) closes it when
   `test:all`, `test:loop-artifacts`, and `test:holosuite-mutation` each run in a
   gate, CI step, or hook, and each role header matches its exit behaviour.
3. **Is the item executable as written?** Not yet. `test:all` is red at HEAD:
   49 of 56 commands pass and 7 fail (172 s wall clock, 4-way concurrency). A
   blocking gate cannot be wired to a red suite, so the plan carries a Phase 0
   remediation before any wiring. The reds are new, not inherited: the
   2026-11-13 increment closed this suite at 56/0 and logged anchor drift as a
   recurring P3 (EV18), so this plan repoints again and leaves the recurrence
   with the scheduled P2 anchor-automation item rather than solving it here.

## Evidence

| ID | Claim | Source | Class |
|---|---|---|---|
| EV1 | `test:all` lists 56 commands and is in no gate, CI step, or hook | `holonovel/scripts/run-test-suite.ts:25-82`; `scripts/lib/gate-manifest.ts:25-292`; `.github/workflows/ci.yml:18-47`; `.githooks/pre-push:101-124` | repo |
| EV2 | `test:all` **is** a publish-pipeline step, skipped only when the delta is patch/editorial and no server path changed | `scripts/publish/steps.ts:330-353` | repo |
| EV3 | `test:holosuite-mutation` is report-only, excluded from `--tier=all`, and in no surface | `holonovel/package.json:129`; `holonovel/scripts/holosuite.ts:9-10,157-158` | repo |
| EV4 | `test:loop-artifacts` declares `[informational]` in its header while exiting 1 on failure, and its header says it is not wired | `scripts/test-loop-artifacts.ts:1-13` | repo |
| EV5 | `npm --prefix holonovel run test:all` at HEAD: `49 passed, 7 failed (171.9s)`, `WALL 172.09 s` | `/tmp/opencode/testall.log` (this session) | tool-output |
| EV6 | 23 `predicate_unresolved` findings resolve to 19 unique stale anchors across five tier libraries | same log; `grep -o "predicate_unresolved @ …"` | tool-output |
| EV7 | The anchors still cite pre-edit lines, e.g. `TOOL_ANNOTATIONS` at `index.ts:200` now at `:201`, `pacingSessions` at `:683` now at `:684`, `registerResource` at `:2617` now at `:2641`, `manage_history` at `:4631` now at `:4655` | anchors in `holonovel/scripts/lib/holosuite-*.ts`; `grep -n` at HEAD | repo |
| EV8 | Two failures are Player-surface leaks, not anchor drift: `test:backfill` T139 (`patrol` present in a PLAYER briefing, `holonovel/scripts/test-backfill.ts:2335-2349`) and `test:narrative` T-new (`Relationship changed:` present, `holonovel/scripts/test-narrative.ts:665-673`) | this session, both re-run individually and failing identically | tool-output |
| EV9 | Both leaks echo the narrative-threads player filter (`relationshipMarkerLines` `holonovel/src/index.ts:1142-1152`; countdown `visibleClock` `:17657-17664`) yet the briefing header already reads `PLAYER`, so the leaking section is not yet identified | `sed -n 17595,17680p holonovel/src/index.ts` | repo |
| EV10 | The full gate is the manifest: `check` = `--full`, `check:fast` = `--fast`; the table in `AGENTS.md` is generated and drift-gated | `package.json:60-61`; `scripts/check-gate-table.ts:1-40`; `AGENTS.md:313` | repo |
| EV11 | The retirement policy downgrades any gate with 20 consecutive zero-finding runs, so a newly wired blocking gate is a future advisory candidate | `scripts/gate-cost-report.ts:1-12,60-98`; no `spec/audit/gate-retirement.json` exists at HEAD | repo |
| EV12 | `playability` (full-only) runs `playability.ts --all`; `test:playability` inside `test:all` runs `--all --self-test`, a superset | `scripts/lib/gate-manifest.ts:236-242`; `package.json:45`; `holonovel/package.json:130` | repo |
| EV13 | CI's server steps duplicate `test:all` coverage: `test:tool-definitions`, `test:security`, `test:starter-novel`, and the six Holosuite tiers are all `TESTS` entries | `.github/workflows/ci.yml:38-47`; `run-test-suite.ts:25-82` | repo |
| EV14 | No existing script wires a harness into a gate; the closest check is `check-gate-table`, which only compares the doc table to the manifest | `grep` over `scripts/check-*.ts` | repo |
| EV15 | `npm run test:loop-artifacts` passes at HEAD (`test-loop-artifacts: passed.`, 0.42 s), so it can be wired blocking immediately | this session, run directly | tool-output |
| EV16 | The root cost report is the `gate-cost` script (the filename is `gate-cost-report.ts`), and its rows come only from `.holonovel-state/gate-timing.json`, so a gate has no row until it has run | `package.json:86`; `scripts/gate-cost-report.ts:60-99` | repo |
| EV17 | The manifest holds 44 gates at HEAD; the cost report's header still says "26 to 32" | `grep -c 'name: "' scripts/lib/gate-manifest.ts`; `scripts/gate-cost-report.ts:5-6` | repo |
| EV18 | A 2026-11-13 increment cleared an earlier seven-command red (`test:all` 49/7 at `6e65c37`) and closed at 56/0; its AAR recorded "27 anchors drifted from code motion alone" as P3. Today's 49/7 is therefore new drift plus two behavioural regressions since that close, not the same defect | `docs/plans/2026-11-13-server-suite-reds/plan.md:26`; `docs/plans/2026-11-13-server-suite-reds/aar.md:3-4,88-89` | repo |

## Decisions

- **D1 — `test:all` becomes a full-only manifest gate, not a CI-only step.**
  CI-only commands widen the CI↔manifest split the roadmap already tracks
  (`ROADMAP.md:59-70`), and `gate-cost-report` cannot see them. A manifest gate
  is visible to pre-push, CI, cost reporting, and the docs table at once.
  *Rejected:* a CI-only step (worsens the split); an advisory gate (§8 G5 makes
  the Pattern Buffer blocking).
- **D2 — dedupe what is a strict duplicate, keep what fast mode needs.**
  `test:all` subsumes the `playability` gate (EV12) and CI's three server steps
  (EV13), and both are full-only or CI-only duplicates, so they go. The
  fast-mode gates `test:data-dir`, `test:world-provider`, and `check-vendor` stay:
  they are duplicated only inside a full run (≈2.7 s measured: `test:data-dir`
  2.1 s, `test:world-provider` 0.3 s, `check:vendor` 0.3 s, EV5) and removing them
  would drop the fast-gate coverage they exist for. The publish pipeline's second
  `test:all` (`scripts/publish/steps.ts:330-353`) is accepted and recorded as
  duplication: publication is rare, the step is fingerprint-scoped, and reading
  `.holonovel-state/gate-run.json` there would couple the publication pipeline to
  a local state file for a three-minute saving.
- **D3 — `test:holosuite-mutation` is wired advisory and protected.** §8
  (`spec/05-verification.md:255-263`) says the method audit "never blocks a
  build", and `holosuite.ts:179-181` skips mutation-tier findings, so the tier
  always exits 0. The gate is visibility-only — it publishes the catch rate in
  every `check`/CI log — and `protected` keeps the retirement report from
  proposing it forever (a tier that can never fail is a permanent candidate:
  `scripts/gate-cost-report.ts:95`).
- **D4 — `test:loop-artifacts` is a blocking fast gate.** It passes at HEAD in
  0.4 s (EV15) and guards the increment contract that `session:close` depends
  on. Its header changes from `[informational]` to `[gate]` so the declared role
  matches the exit behaviour; role headers are governed by the Script discipline
  section of `AGENTS.md`, not by REQ-141m (which governs fail-loud harnesses).
- **D5 — new blocking gates are protected from auto-retirement, at both ends.**
  `test:all`, `test:loop-artifacts`, and the visibility gate carry spec-required
  or contract-critical coverage. Add a `protected?: boolean` field to `Gate`;
  `gate-cost-report` excludes protected gates from `candidates`, **and**
  `retiredGates()` ignores a protected name even when it appears in
  `spec/audit/gate-retirement.json` (warning on stderr). Without the second half
  a hand-written retirement entry still downgrades the gate.
- **D6 — the server leaks are fixed, not papered over.** If the triage shows the
  briefing itself leaks GM-scoped state to the Player badge, fix the renderer.
  Changing `test-backfill.ts`/`test-narrative.ts` to match a leak is permitted
  only when the assertion, not the server, contradicts a current REQ, and then
  the REQ is cited in the task note.
- **D7 — no spec edit.** The wiring is builder-side (manifest, CI, hooks);
  §8 already states the requirement. If Phase 0 exposes a genuine spec defect,
  it is recorded in `spec/audit/review-register.md` and scheduled, not folded in.

## Phases

### Phase 0 — make the suite green (blocking precondition)

**S1 — Repoint the 23 stale anchor sites (19 unique targets).** Files:
`holonovel/scripts/lib/holosuite-conformance.ts` (five sites: `:35`
`TOOL_ANNOTATIONS`, `:36` `registerResource`, `:37` `prompt`, `:170`
`surfaceProfile`, `:192` `err`), `holosuite-invariants.ts` (`manage_history`,
`pacingSessions`, `replayInspection`, `context_report`, `saveNovel`),
`holosuite-novel.ts` (`context_report`, `visibility_check`, `knowledge_query`,
`computeBundleIntegrity`, `recap`, `saveNovel`), `holosuite-adversarial.ts`
(`create_room`, `verify`, `inboxSourcePath`, `share`, `recap`, `strictMode`),
`holosuite-differential.ts` (`saveNovel`). Each site is repointed to the line
where its symbol actually sits, and the symbol string is left unchanged. Generic
symbols (`err`, `prompt`, `share`, `verify`, `recap`) are resolved by content
context — the declaration or action branch the finding class describes — not by
the first textual match.

*Verify:* (a) the five tier commands exit 0:
`npm --prefix holonovel run test:holosuite-conformance` (then `-invariants`,
`-novel`, `-adversarial`, `-differential`); (b) because the predicate only checks
that the line contains the symbol, the repoint is additionally proven by a
per-anchor review table appended to `tasks.md`: old line, new line, the
declaration found on the new line, and the `grep -n` that produced it. A site
whose symbol has more than one plausible home is marked in that table and
cross-checked against the finding class it serves.

**S2 — Triage and fix the two Player-surface leaks.** Start from EV9: reproduce
each failing assertion, then locate the briefing section that emits the text.
Decision rule (D6): a leak in the renderer is fixed in
`holonovel/src/index.ts`; an outdated assertion is corrected only with a REQ
citation. Scope ceiling: one renderer site plus its filter; if the fix needs a
new state field or a cross-module change, stop and schedule it (the plan's
fallback below applies).

*Execution amendment (delta, recorded before the fix landed):* the leaks were
not in the renderer.
(a) `manage_countdown (action: set)` never declared or persisted
`badge_scope`, although `Countdown.badge_scope` exists
(`holonovel/src/core/state.ts:369-371`) and REQ-073c1/073c2 require every
countdown to carry it — so a GM-only clock was indistinguishable from a shared
one and the correct filter at `holonovel/src/index.ts:17657` had nothing to
filter. The fix declares the parameter, threads it through the setter, and
preserves the stored value when a later set omits it (three edits, one file).
(b) The T-new `test-narrative` assertion forbade every relationship marker on
the Player surface, but REQ-281b keeps own-entity bonds visible; the earlier
Mara↔Kestrel marker is legitimate and the NPC↔NPC Kestrel↔Cora marker is the
one that must stay off. The assertion is narrowed to that pair with the REQ
citation.
The parameter addition regenerates `holonovel/tool-definitions.json`, rewrites
`spec/audit/tool-surface-baseline.json`, and moves the recorded budgets in
`holonovel/DECISIONS.md` — all now in the blast radius.

*Verify:* `npm --prefix holonovel run test:backfill` and `test:narrative` exit 0
with all assertions passing; no other harness regresses (`test:all` in S3);
`surface-budget` PASS after the recorded counts are refreshed.

**S3 — Suite dry run.** `npm --prefix holonovel run test:all` (the root delegator
does not exist until S4) must print `56 passed, 0 failed` — the runner prints
`N passed, M failed (Ts wall clock)` — and exit 0. Record the wall time; EV5's
172 s is the comparison. This is the error-gate dry run: no wiring step starts
before this is green, and the Phase 0 repair lands as its own commit before any
wiring (see Commit order).

### Phase 1 — wire the three surfaces

**S4 — Manifest and delegators.** `scripts/lib/gate-manifest.ts`: add `test:all`
(description "Server harness suite: 56 commands incl. the Pattern Buffer and
harness guard", `fast: null`, `full: npm("test:all")`, `protected: true`), add
`test:loop-artifacts` (`fast: npm("test:loop-artifacts")`,
`full: npm("test:loop-artifacts")`, `protected: true`), add
`test:holosuite-mutation` (`fast` and `full` = `npm("test:holosuite-mutation")`,
`advisory: true`, `protected: true`; visibility-only, D3), and remove the
`playability` gate (EV12, D2). Root `package.json` gains two delegators beside
the existing `test:data-dir` (`package.json:50`):
`"test:all": "npm --prefix holonovel run test:all"` and
`"test:holosuite-mutation": "npm --prefix holonovel run test:holosuite-mutation"`,
so each gate command and its documented name are one string.

**S5 — Retirement guard.** `scripts/lib/gate-manifest.ts` gains the `protected`
field, and `retiredGates()` ignores a protected name with a stderr warning;
`scripts/gate-cost-report.ts` excludes protected gates from `candidate` and
corrects its stale header count ("26 to 32" → the manifest's current count, EV17;
46 after S4). *Verify (after one full `check` so timing rows exist, EV16):*
`npm run gate-cost -- --threshold 1 --json` shows a `test:all` row and lists no
protected gate in `candidates`; a temporary `gate-retirement.json` naming
`test:all` does not make it advisory in `npm run gates -- --list`.

**S6 — Role header.** `scripts/test-loop-artifacts.ts` header: `[informational]`
→ `[gate]`, and replace "Not wired into run-gates; run it directly." with the
gate name it now belongs to (EV4). *Verify:* `npm run check-script-discipline`.

**S7 — CI dedupe.** `.github/workflows/ci.yml`: delete the three server steps
now covered by `npm run check` (tool-definition + security, bundled starter
Novel, Holosuite deterministic tiers, `:38-47`) and keep the packed-artifact
smoke step. No new step is needed: the `Full gate` step runs `test:all` through
the manifest. *Verify:* `npm run check-workflows`; confirm by reading the job
that no removed command lacks a remaining surface.

**S8 — Hook dedupe.** `.githooks/pre-push:100-124`: inside the `suite_ran =
false` branch, delete the `test:tool-definitions`/`test:security` block and the
six-tier Holosuite block; `npm run check` now runs both through `test:all`. Keep
the pending-update, spec-sync, and strict-coverage blocks unchanged. *Verify:*
`bash -n .githooks/pre-push`; `npm run check-script-discipline`; confirm
`--recorded` still reports `full` after a full run.

### Phase 2 — documentation and close

**S9 — Regenerate the gate table.** `npm run gates -- --list --format=md` into
the `gate-manifest` markers in `AGENTS.md` (EV10); add one sentence to the Gates
section naming `test:all` as a full-only ~3-minute gate and `test:holosuite-mutation`
as advisory. *Verify:* `npm run check-gate-table`.

**S10 — Correct the stale prose.** `holonovel/scripts/playtest/README.md:154-158`
says the method audit is "excluded from every gate"; it is now an advisory gate.
Update the sentence (and `holonovel/scripts/holosuite.ts:9-10` if its wording
mirrors it) without changing behaviour.

**S11 — Records.** On the primary path, delete the closed roadmap section
(`ROADMAP.md:15-32`) and add the dated `CHANGELOG.md` entry. On the fallback path
(C-1), leave the section in place, narrow its bullets to the two failing
assertions, and add the dated entry naming what shipped. The residual scope is
also carried in the AAR either way.

## Commit order

Three reversible commits, each gated (the split follows the Agent Operating
Routine: a red baseline is fixed first, as its own commit):

1. **Red-baseline repair** — S1 + S2 + the S1 review table (on the C-1 fallback
   path, S1 + the review table only).
   **Primary gate:** the five tier commands and the two harnesses exit 0; then
   `npm --prefix holonovel run test:all` (S3) exits 0.
   **Fallback gate:** the five tier commands exit 0 and `test:all` reports exactly
   the two known failures (T139 and T-new) and nothing else.
2. **Surface wiring** — S4–S8. Gate: `npm run check:fast` PASS; a full
   `npm run check` PASS before the commit.
3. **Docs and close** — S9–S11 plus `CHANGELOG.md`. Gate: `check-gate-table`,
   `check-script-discipline`, `check-workflows`, `check-roadmap`, `typecheck`,
   then `npm run session:close`.

## Blast radius

| File | Change |
|---|---|
| `holonovel/scripts/lib/holosuite-conformance.ts` | S1 — repoint 5 anchors |
| `holonovel/scripts/lib/holosuite-invariants.ts` | S1 — repoint 5 anchors |
| `holonovel/scripts/lib/holosuite-novel.ts` | S1 — repoint 6 anchors |
| `holonovel/scripts/lib/holosuite-adversarial.ts` | S1 — repoint 6 anchors |
| `holonovel/scripts/lib/holosuite-differential.ts` | S1 — repoint 1 anchor |
| `holonovel/src/index.ts` | S2 — countdown `badge_scope` setter (schema, destructure, set object) |
| `holonovel/scripts/test-narrative.ts` | S2 — narrow the marker assertion to the NPC↔NPC pair (REQ-281b) |
| `holonovel/tool-definitions.json` | S2 — regenerated after the parameter addition |
| `spec/audit/tool-surface-baseline.json` | S2 — `surface-budget --write` |
| `holonovel/DECISIONS.md` | S2 — recorded full/standard token counts |
| `scripts/lib/gate-manifest.ts` | S4/S5 — three gates, one removal, `protected` + retirement enforcement |
| `scripts/gate-cost-report.ts` | S5 — protected-gate exclusion + header count |
| `package.json` | S4 — root `test:all` and `test:holosuite-mutation` delegators |
| `scripts/test-loop-artifacts.ts` | S6 — role header |
| `.github/workflows/ci.yml` | S7 — remove three subsumed steps |
| `.githooks/pre-push` | S8 — remove two subsumed blocks |
| `AGENTS.md` | S9 — regenerated table + cost sentence |
| `holonovel/scripts/playtest/README.md` | S10 — gate status sentence |
| `holonovel/scripts/holosuite.ts` | S10 — header wording if it mirrors the README |
| `ROADMAP.md` | S11 — remove the closed section |
| `CHANGELOG.md` | S11 — dated entry |
| `docs/plans/2026-11-15-verification-surface-reachability/` | plan, tasks, AAR |

## Done bar

**Done bar:** the three harnesses each run in a gate, CI step, or hook with a
role header that matches their exit behaviour, and both `npm run check:fast` and
`npm run check` pass on the final tree.

1. `npm run test:all` (root) exits 0 with every command passing.
2. `npm run check:fast` passes, including `test:loop-artifacts` and the advisory
   `test:holosuite-mutation`.
3. `npm run check` passes, including `test:all` as a full-only gate.
4. `npm run check-gate-table`, `check-script-discipline`, `check-workflows`, and
   `typecheck` pass; `bash -n .githooks/pre-push` is clean.
5. The three harnesses each appear in a running surface, and
   `scripts/test-loop-artifacts.ts` declares `[gate]`.
6. `ROADMAP.md` no longer carries the section; `CHANGELOG.md` is dated; `aar.md`
   ends `LOOP PAUSED`.
7. Precondition for any `check:fast`/`check` run in this increment: `aar.md`
   already exists and carries a LOOP token (`scripts/lib/loop-artifacts.ts:71-80`);
   the close step rewrites it, it is not created by it.

## Risks and conditions

- **C-1 — S2 stayed inside its ceiling; the fallback was not used.** The leaks
  were a missing `badge_scope` setter (REQ-073c1/073c2) and an over-broad
  assertion (REQ-281b), not a renderer filter, so the fallback path was never
  entered. If a later revision of this fix needs more than the three edits in
  `holonovel/src/index.ts`, the fallback applies: stop after S1, commit the
  anchor repair alone (commit 1; its fallback gate is stated in
  `## Commit order`), keep the wiring and S11's section deletion out, and
  replace this plan's done bar with the fallback bar: commit 1 lands,
  `ROADMAP.md` keeps a narrowed section naming the two failing assertions, the
  AAR records why the leaks were not fixed, and the increment closes
  `LOOP PAUSED`. `test:all` is never wired blocking while it is red.
- **C-2 — full-gate cost.** `test:all` adds ~3 minutes to `check` and to a
  first-time pre-push. `check:fast` is unchanged. Confirm the wall time in S3 and
  record it in S9's sentence.
- **C-3 — anchor repoints are evidence-only.** They change which line a finding
  cites, not what a tier asserts; S3 must show the same pass/fail set apart from
  the fixed predicates.
- **C-4 — hook edit is untested in place.** `pre-push` cannot be exercised
  without pushing; verification is `bash -n`, the discipline gate, and a
  `--recorded` round trip on a full run.
- **C-5 — the fallback commit gate was fixed after the re-review cap.** The
  targeted re-review (standard's one re-review) confirmed every prior Blocker and
  eight Majors resolved and left one Major in the amended fallback text; that
  text is now corrected, but no further cold pass ran. `build-review` verifies
  the fallback gate wording against `## Commit order` and `tasks.md` before the
  first commit, and the fallback is exercised only if S2 overruns.

## Alternatives considered

- **Wire `test:all` only in CI** — rejected (D1): widens the CI↔manifest split
  that the next roadmap item tracks, and hides the cost from `gate-cost-report`.
- **Wire the whole suite into `check:fast`** — rejected: 172 s per local
  iteration defeats the fast gate's purpose.
- **Leave the `playability` gate beside `test:all`** — rejected (D2): the same
  shipped-Novels run would execute twice in every full pass.
- **Leave the anchors for the P2 repoint-automation item** — rejected: that tool
  does not exist yet, and the suite cannot go green without the repoints.
- **Make the publish harness step read `.holonovel-state/gate-run.json`** —
  rejected (D2): it saves a three-minute repeat on a rare path at the cost of
  coupling the publication pipeline to a machine-local state file.

## Open questions

1. Whether S2's leak is one shared section or two independent ones — resolved by
   the first triage step, not assumed here.
2. Whether `holonovel/scripts/holosuite.ts`'s header repeats the "excluded from
   every gate" claim — checked in S10.
