# Plan — U4: verification workflows and CI (chunk 4 of 8)

Status: draft v4 (self pass 3 defects; cold pass 2 Blockers, 3 Majors, 3 Nits;
diff re-audit 1 residual Blocker, 2 Nits; targeted v3 check 2 Nits — every
Blocker and Major is fixed, and the last pass found no hard blocker or Major,
which is the plan-review Stop rule) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-15-unscoped-u4/`
Rollback cost: 1 (one revert: `plan.md`, `tasks.md`, `review.md`, `aar.md`, the
register rows, the `worklist.md` status and exit-evidence lines, the `ROADMAP.md`
trigger line, the bounded §8 prose fixes, `holonovel.md` +
`holonovel/holonovel.md`, `CHANGELOG.md`)
Evidence class: repo and tool-output (`EV2`, `EV6`, `EV7`, `EV10`, `EV13`, `EV17`
are `tool-output`; every other premise is a `file:line` read at HEAD `5aa2e64`)
Trust boundary: every premise is read from the working tree at HEAD `5aa2e64`;
no web, user, or fetched content enters the plan.
Review independence: fresh — cold pass recorded in `plan.cold/report.md`, whose
hash the stamp records.

## Resolutions (cold pass v1 → v2)

- **B-1 [Blocker] — the §5.12 count was 84, not 82.** `EV12` now states 84 REQ
  bodies in `spec/02-requirements.md:3566-3813` (first `:3583`, last `:3809`) and
  drops "all sub-lettered" (`REQ-353` at `:3591` is unsuffixed). C-1 carries the
  corrected number.
- **B-2 [Blocker] — the CI step count was wrong twice.** `EV10` now records 15
  steps in the `gates` job (`ci.yml:12-46`) and names exactly which commands are
  outside the manifest, instead of the earlier 12/9 pair. C-3 and the CI row are
  restated from the name list, so the count is derived rather than asserted. The
  diff re-audit caught two survivors of the old pair (step 12 and Open question
  1), and the targeted v3 check caught a granularity error in the replacement.
  The counts are now taken from a direct enumeration of `run:` lines: the nine
  verification steps hold 16 commands, one of them the manifest gate
  `check:starter-freshness`, so 15 are outside the manifest and 10 of those are
  `npm run` composites.
- **M-1 [Major] — D5's "eleven workflows" had no referent.** D5 now states the
  nine workflows §8 defines and names which have harnesses, with no invented
  count.
- **M-2 [Major] — C-12's probe was dead and its fix pair was wrong.** The
  DECISIONS numbering lives in §9 (`spec/06-artifacts.md:16-19`), and the
  handoff-check rows H10/H12 (`:55`, `:57`) plus §8 `:6` already say (6); the
  stale site is `spec/03-build.md:742`. Step 15 now corrects that single site and
  forbids editing §9 or the H rows; C-13 was added for the second textual
  inconsistency the probe exposed.
- **M-3 [Major] — 23 of 44 gates had no row and no boundary.** D1 now names the
  row-free manifest gates and the existing coverage that enforces them, citing
  the worklist's code-surface line.
- **N-1 [Nit] — the register-parser explanation was inverted.** The blast radius
  now says the parser keys on the `##` disposition heading and rejects any other.
- **N-2 [Nit] — the CI job anchor was `:8`, which is `jobs:`.** The surface row
  now reads `:9-47`.
- **N-3, U-1…U-6 [Nits/Unknowns] — no action.** The warning baseline (`EV17`) is
  this session's own `tool-output`; T13 re-measures it before any edit. The cold
  reviewer could not reproduce it read-only, which is expected, not a defect.
- **U-7 [Unknown] — the cold pass ran its stages in one fresh child context.**
  Independence from the author holds; stage-to-stage isolation does not. Recorded
  as a condition on the stamp.

## Questions

1. **Which roadmap item is next?** `ROADMAP.md:15-32` — the Unscoped-surface
   review sweep (P2). Its `**Trigger:**` (`:30-32`) names the next allocated
   review session as **U4, verification workflows and CI**. The three other open
   items are later: harness test-ID hygiene (`:34-49`), anchor repoint automation
   (`:51-64`), and the loop-gate re-measurement dated 2026-11-28 (`:66-76`).
2. **What does U4 owe?** The worklist defines the chunk
   (`docs/plans/2026-11-10-unscoped-surface-review/worklist.md:192-203`): prose
   `spec/05-verification.md` §8; code `scripts/run-gates.ts`, every root
   `scripts/check-*.ts` and `scripts/test-*.ts`,
   `holonovel/scripts/run-test-suite.ts`, `holonovel/scripts/test-harness-guard.ts`,
   and `.github/workflows/ci.yml`; lens `drift-report` plus gate-coverage review;
   already gated by the manifest itself, `check-workflows`, `test:workflows`,
   `check-gate-table`, and `check-script-discipline`.
3. **Is the chunk session-achievable?** Measured: 18 §8 blocks (`EV5`) + 30 root
   script rows (`EV7`) + 2 server harness rows + 2 CI job rows = **52 verdict
   rows**. Each code row settles four facts (role header, exit contract, the
   wiring that runs it, the §8 clause it serves), which is a scan, not a review;
   §8 is 269 lines. The bar is one session. The split fence is **pre-declared**:
   if Phase 2 cannot finish, split at the prose/code boundary (U4a = the 18 §8
   rows, U4b = the 34 code/CI rows) and record it in `worklist.md` under `D6` —
   never use a split as a done-bar escape hatch.
4. **What counts as a finding here?** Two classes, because the chunk pairs prose
   with the gates: (a) *drift* — §8 states a workflow, contract, count, or check
   token that no gate, harness, or script delivers, or names a file/naming
   convention the tree does not contain; (b) *coverage* — a workflow §8 treats as
   running is unreachable from the manifest, CI, and the hooks, or a gate that
   runs is invisible to the local surface so a green session does not imply a
   green CI. Prose that instructs an external builder with no repository check is
   `builder-side` (`D1`), not a gap.

## Baseline at HEAD (this session)

| # | Evidence | Command / source | Trust |
|---|---|---|---|
| EV1 | Tree clean on `main`, HEAD `5aa2e64`, 95 unpushed commits, version `2026.11.15`, 4 open roadmap items | `git status --porcelain`; `git rev-parse --short HEAD`; `npm run status` | tool-output |
| EV2 | Fast gate green: 41 passed, 0 failed, `check:fast: PASS` (un-piped) | `npm run check:fast` | tool-output |
| EV3 | The roadmap item and its trigger | `ROADMAP.md:15-32` | repo |
| EV4 | Chunk U4's prose, code, lens, gates, and exit evidence; the status row | `docs/plans/2026-11-10-unscoped-surface-review/worklist.md:94,192-203` | repo |
| EV5 | §8 is 269 lines in **18 blocks**: lead-in `:3-10`; workflow table and `GN` vocabulary `:12-27`; G0a `:29-34`; G0b `:36-43`; G2 `:45-74`; G2 coverage completeness `:76-83`; G3 `:85-93`; G4 `:95-109`; G5 `:111-119`; G6 `:121-136`; G7 `:138-149`; T18 anti-badge table `:151-160`; persona table `:162-170`; G8 `:172-226`; Holosuite method and shared schema `:228-239`; nine lenses `:241-253`; mutation-audit catch rate `:255-263`; coverage traceability `:265-268`. Four `_Check:_` lines (`:74`, `:83`, `:136`, `:226`) | `wc -l spec/05-verification.md`; `sed -n '1,269p'` | repo |
| EV6 | The manifest holds **44** gates, of which three are full-only (`check-container-image`, `playability`, `test:pipeline`), so `npm run gates -- --list` prints 41 fast rows; both `check` and `check:fast` delegate to it (`package.json`: `gates -- --full --timing`, `--fast --timing`) | `scripts/lib/gate-manifest.ts:25-292`; `npm run gates -- --list` | tool-output |
| EV7 | Root `scripts/` holds 63 top-level `.ts` files: 21 `check-*.ts`, 8 `test-*.ts`; 17 checks are named in the manifest, `check-guarded-rule-change` is hook-only (`.githooks/pre-commit`), `check-registry-publish` is publish-only (`scripts/check-workflows.ts:44` requires it in `publish.yml`), and `check-ruleset-model`/`check-ruleset-package` are driven by `test:ruleset-gates` (`holonovel/scripts/test-ruleset-gates.ts`) | `ls scripts/check-*.ts scripts/test-*.ts`; per-name `grep` over `scripts/lib/gate-manifest.ts`, `.githooks`, `scripts/publish` | tool-output |
| EV8 | `test:loop-artifacts` appears **only** in `package.json:25` — no manifest entry, no CI step, no hook, no suite entry. It is the self-test of the `check-loop-artifacts` gate | `grep -rn 'test:loop-artifacts' package.json scripts/lib/gate-manifest.ts .github/workflows .githooks scripts/*.sh` | tool-output |
| EV9 | `test:holosuite-mutation` exists at `holonovel/package.json:129` and appears in **no** running surface: not in `run-test-suite.ts`'s 56-entry `TESTS` (`:25-82`), not in `.githooks/pre-push` (`:101-115`), not in `ci.yml` (`:43-45`) | `grep -n` on the four files | tool-output |
| EV10 | CI's `gates` job runs **15 steps** (`ci.yml:12-46`): 2 action steps, 2 installs, `assemble`, `npm run check`, and 9 verification steps. Only two manifest gates run there — `check` and `check:starter-freshness` (inside the starter step); the other verification commands are outside the manifest: `shellcheck`, `version-check.ts`, `spec-delta.ts --report-only`, two `npm audit` runs, `test:tool-definitions`, `test:security`, `test:starter-novel`, six `test:holosuite-*` tiers, and `test:package-smoke`. The `container` job (`:49-56`) builds and starts the image | `sed -n '1,56p' .github/workflows/ci.yml`; gate-manifest names | tool-output |
| EV11 | §8 contains **zero** `npm run` occurrences: the section names workflows (`G0a`…`G8`), not commands, so the worklist's "§8 command list matches `npm run gates -- --list`" clause has no target | `grep -c 'npm run' spec/05-verification.md` | tool-output |
| EV12 | G7's attestation predicate is **self-attesting**: `SECTION_512_REQS` lists 31 base families (`holonovel/src/index.ts:375-383`), `G7_ATTESTATION_RECORDED = true` is a literal (`:384`), and the disposition is `pass` whenever `implemented.length >= total.length` (`:15392`). §5.12 spans `spec/02-requirements.md:3566-3813` and carries **84** REQ bodies (first body `:3583`, last `:3809`; `REQ-353` at `:3591` is the one unsuffixed header), so a family list cannot evidence "every narrative-critical REQ" | `grep -n` on `index.ts`; `awk` over the §5.12 span | repo |
| EV13 | §8 G4 requires each automated test to ship `scripts/test_N.sh` or `scripts/test_N.ts` (`:99`); the tree contains **zero** files matching either pattern — root harnesses are `scripts/test-*.ts` and server harnesses `holonovel/scripts/test-*.ts` | `find . -name 'test_*.ts' -o -name 'test_*.sh'` | tool-output |
| EV14 | `holonovel/DECISIONS.md` carries exactly one `@section evidence` (`:2377`, under `#### narrative_coherence (G7)` at `:2375`); the `@section evidence-g8` that T449 and §8 `:225` cite does not exist | `grep -n '@section evidence' holonovel/DECISIONS.md` | repo |
| EV15 | The legacy "Gate N" form appears **zero** times outside §8 — the `GN` vocabulary holds | `grep -rn 'Gate [0-9]'` over `spec/`, `README.md`, `AGENTS.md`, `docs/`, `holonovel/*.md` | tool-output |
| EV16 | §8 is **assembled but not fingerprint-bearing**: `05-verification.md` is in `CORE_FILES` (`scripts/assemble.ts:27`), and `DATA_SECTIONS` is `### 7.7 ` (`scripts/lib/contract-fingerprint.ts:37-43`) | `scripts/assemble.ts:21-31`; `scripts/lib/contract-fingerprint.ts:37-43` | repo |
| EV17 | Full-mode prose baseline: **0 errors, 296 warnings**, coverage register current, proofread register matching the live count (286). **§8 itself carries no warning** — no `spec/05-verification` site appears in the report | `npm run validate:sdd` (un-piped, exit 0) | tool-output |

## Surface inventory (the row budget)

One row per unit, as `D1` defines it. The row count is the done bar's countable
form.

| Surface | Anchor | Rows |
|---|---|---|
| §8 lead-in: the evidence-record contract and the fixture/ruleset split | `spec/05-verification.md:3-10` | 1 |
| §8 workflow table and the `GN` vocabulary | `:12-27` | 1 |
| G0a Structural integrity | `:29-34` | 1 |
| G0b MCP conformance | `:36-43` | 1 |
| G2 Golden transcript replay | `:45-74` | 1 |
| G2 coverage completeness | `:76-83` | 1 |
| G3 Injection | `:85-93` | 1 |
| G4 Derived tests | `:95-109` | 1 |
| G5 The Pattern Buffer | `:111-119` | 1 |
| G6 Synthesis lifecycle | `:121-136` | 1 |
| G7 Narrative coherence attestation | `:138-149` | 1 |
| T18 anti-badge sub-workflows | `:151-160` | 1 |
| Persona → Pattern Buffer table | `:162-170` | 1 |
| G8 Cross-ruleset isolation (nine steps) | `:172-226` | 1 |
| Holosuite evaluation method and shared schema | `:228-239` | 1 |
| Holosuite nine analytic lenses | `:241-253` | 1 |
| Holosuite mutation-audit catch rate | `:255-263` | 1 |
| Holosuite coverage traceability | `:265-268` | 1 |
| `scripts/run-gates.ts` (both modes, advisory, recording) | `scripts/run-gates.ts` | 1 |
| 21 root `scripts/check-*.ts` — one row each | `scripts/check-*.ts` | 21 |
| 8 root `scripts/test-*.ts` — one row each | `scripts/test-*.ts` | 8 |
| `scripts/run-test-suite.ts` (the server suite runner) | `holonovel/scripts/run-test-suite.ts` | 1 |
| `scripts/test-harness-guard.ts` (the fail-loud meta-test) | `holonovel/scripts/test-harness-guard.ts` | 1 |
| CI `gates` job (15 steps) | `.github/workflows/ci.yml:9-47` | 1 |
| CI `container` job | `:49-56` | 1 |
| **Total** | | **52** |

`holonovel/scripts/**` harness correctness beyond the two named scripts is
U6's surface (worklist `:72`); `.github/workflows/publish.yml` is U5's (worklist
`:213`). Both are boundary notes, not rows.

## Enforcement surface to map against

Read once in Phase 1; each row cites the predicate it resolved to, not a gate's
message (`AGENTS.md` "Finding evidence").

| Consumer | Anchor | Severity today | Contract |
|---|---|---|---|
| `run-gates` full mode | `scripts/run-gates.ts:190-215` | exit 1 on the first failing gate, exit 2 when a gate cannot start | sequential, stops at first failure; an advisory gate logs and continues |
| `run-gates` fast mode | `:217-249` | exit 1 if **any** buffered gate failed; exit 2 on a spawn error | every sub-check's failure propagates (the §8 G4 parallel rule) |
| `run-gates` list/record | `:126-174` | exit 0 | `--list --format=md` is the generated AGENTS table; `--recorded` reads the run manifest the hooks trust |
| `check-gate-table` | `scripts/check-gate-table.ts:1-40` | exit 1 | the AGENTS.md table between the markers equals `renderMarkdownTable()` |
| `check-workflows` | `scripts/check-workflows.ts:1-60` | exit 1 | action pins are full SHAs at the Node-24-capable major; the publish workflow reads registry state through the deterministic endpoint |
| `check-script-discipline` | `scripts/lib/script-discipline.ts` | exit 1 | shebang, role header, exit codes 0–2, path and shell rules; shells through `shellcheck -S warning` when installed |
| `check-script-quality` | `scripts/lib/script-quality.ts` | exit 1 (baselined) | reachability (a harness is wired into a `package.json` script), duplicate helpers, repeated parses, parser bypass |
| `test-harness-guard` | `holonovel/scripts/test-harness-guard.ts:43-68` | exit 1 | a spawning harness that drains without `harnessComplete()` exits non-zero (REQ-141m) |
| `run-test-suite` | `holonovel/scripts/run-test-suite.ts:141-171` | exit 1 if any of the 56 commands fails | bounded concurrency, buffered per-command output, whole-run failure |
| `.githooks/pre-push` | `.githooks/pre-push:32-160` | exit 1 | skips only on a recorded full run; otherwise runs `check`, the server harnesses, the Holosuite tiers, and the strict coverage gate |
| `ci.yml` | `.github/workflows/ci.yml:18-47` | job failure | each step's exit code fails the job; no step swallows one |

## Pre-review candidates

Each candidate is checked against its predicate in Phase 2. A candidate that
does not survive becomes `holds` with the predicate cited; it is not a finding
and is not restated in the register.

| ID | Claim to test | Probe |
|---|---|---|
| C-1 | **Flagship.** G7 asserts "every narrative-critical REQ (§5.12) has an implementation status of `converged` or a recorded waiver", but the disposition is derived from two hardcoded arrays and a literal `true` (EV12), so it can never report `fail`; the arrays enumerate 31 base families while §5.12 carries 84 REQ bodies. An attestation that cannot fail is not evidence | `sed -n '372,390p' holonovel/src/index.ts`; `awk` over `spec/02-requirements.md:3566-3813`; read `:15388-15395` |
| C-2 | **Two verification surfaces never run.** `test:holosuite-mutation` (`holonovel/package.json:129`) and `test:loop-artifacts` (`package.json:25`) exist and appear in no gate, hook, CI step, or suite (EV8, EV9). §8's mutation-audit block makes a published catch rate the precondition for Understudies evidence, and that harness is the only producer of it | the two `grep -rn` probes in EV8/EV9; read `holonovel/scripts/holosuite.ts --tier=mutation` wiring |
| C-3 | **CI is wider than the manifest.** Nine verification steps hold 16 commands, of which one is a manifest gate (`check:starter-freshness`); the other 15 — ten of them `npm run` composites — are outside the manifest, so `check`/`check:fast` can be green while CI fails, and those commands are invisible to `gate-cost-report` and the retirement policy. Decide whether that is a coverage gap (a finding) or a declared split (an AGENTS statement to make) | EV10's step list against `GATES`; read `scripts/gate-cost-report.ts` for the retirement scope |
| C-4 | **§8 names a test-file convention the tree does not use** (EV13). If the sentence is normative, no harness conforms; if it is illustrative, the example is stale. Appendix M's bar decides | `grep -n 'test_N\|test_[0-9]' spec/*.md`; read the REQ-150/REQ-141m bodies |
| C-5 | **No B-fixture golden-transcript test resolves.** §8 G2's `_Check:_` names two IDs and one prose token (`:74`); Appendix F carries no "Golden transcript" row except REQ-150a/b's coverage rows (`spec/appendices-reference.md:366-367`). A check line whose middle element is not an ID cannot be resolved by the coverage audit | read Appendix F rows T88–T92 and REQ-150a/b; grep `golden` across `holonovel/scripts` |
| C-6 | **The G7 evidence record omits the §8 contract fields.** §8 `:3-6` requires workflow name, timestamp, environment pins, commands and output, pass/fail, and findings; `holonovel/DECISIONS.md:2375-2384` carries three lettered claims and a `spec_health` bullet | read `:2370-2390` against `:3-6` |
| C-7 | **G8's evidence section does not exist.** §8 `:225` and T449 place G8 evidence in `@section evidence-g8`; DECISIONS carries only `@section evidence` (EV14) | EV14's probe; `grep -n 'evidence-g8' spec/ holonovel/` |
| C-8 | **G5/G6 assert a re-run discipline nothing schedules.** §8 G6 says the Pattern Buffer re-runs after every server code change; `test:pattern-buffer` and `test:pattern-buffer-ruleset` are in neither the manifest, CI, nor pre-push (EV9's probe over both nameships). Either the reference implementation does not follow its own rule, or the rule is builder-side | `grep -rn 'pattern-buffer' .githooks .github scripts/lib .` |
| C-9 | **The parallel-propagation rule is already satisfied — verify, do not assume.** §8 G4 `:102-105` makes a zero-exit failing gate non-conformant; `run-gates` fast mode counts every buffered failure (`:225-249`) and `run-test-suite` fails the whole run (`:160-170`). Record the predicate rather than a finding | read both runners; `scripts/test-commit-plan.ts` fast-mode self-test |
| C-10 | **"Networking disabled (REQ-051)" has no enforcement.** §8 G4 `:96` requires tests to run with networking off; no harness sets a network guard, and the claim's predicate is the tool annotation `openWorldHint: false` (`holonovel/src/index.ts` `TOOL_ANNOTATIONS`) | `grep -rn 'openWorldHint' holonovel/src`; `grep -rn 'network' holonovel/scripts/test-security.ts` |
| C-11 | **G0b's "MCP Inspector or equivalent" resolves to a CI-only smoke.** `test:package-smoke` drives a handshake (`holonovel/scripts/smoke-package.ts`, REQ-614) and runs in CI (`ci.yml:46-47`), not in `check`/`check:fast`; G0b claims a per-build conformance check | EV10; read `holonovel/scripts/smoke-package.ts` header |
| C-12 | **The evidence item number drifted.** §9 defines the DECISIONS.md sections: (5) is waivers, (6) is verification evidence with `evidence-g0a`…`evidence-g8` sub-sections (`spec/06-artifacts.md:16-19`); the handoff-check rows H10 and H12 place that evidence in **(6)** (`:55`, `:57`); §8 `:6` also says (6). `spec/03-build.md:742` records the ruleset-free skip in "(5)", so one of the two is stale — §9's definition and both H rows favour (6) | read `spec/06-artifacts.md:12-20,55,57`; `grep -n 'DECISIONS.md (5)' spec/03-build.md` |
| C-13 | **The skip annotation has two spellings.** Standing Rule 9 prescribes `ruleset-free — skipped` in DECISIONS.md (`spec/01a-constitution.md:36-40`); G0a says a ruleset-free build reports "no ruleset — skipped" (`spec/05-verification.md:32`), and T259 asserts exactly that string (`spec/appendices-reference.md:1726`). T259 asserts **both** forms in one test — G0a passes with "no ruleset — skipped" *and* the convergence metrics record `ruleset-free` dispositions — which is the discriminator between two intentional annotations and one drifted token; Rule 9's precedence sentence also lets a section's own ruleset-free clause stand | read Rule 9, §8 `:29-34`, and T259; `grep -rn 'ruleset-free — skipped\|no ruleset — skipped' spec/` |

## Objective

Close chunk U4 with an evidence-backed verdict for every unit of its declared
surface, so the question "do the verification workflows the spec states
correspond to the gates and CI that actually run, and does every gate that runs
propagate its failure?" is answered once, durably, in the register's disposition
vocabulary.

## Done bar

**Done bar:** 52 verdict rows with a cited predicate, every finding terminally
dispositioned, zero unfixed P0, the program record advanced, and the gates green
— the numbered list below is the authoritative form.

1. `review.md` in this directory holds **52 verdict rows** (counted by
   `grep -cE '^\| [0-9]+ \|' review.md`; the verdict table is the file's only
   numbered table) — the "Surface inventory" table is the budget — each row
   carrying surface, anchor, a verdict (`holds` / `finding:<ID>` /
   `builder-side` / `already-reviewed:<chunk>`), and the predicate
   (`file:line`) that settles it. Columns: `# | Surface | Anchor | Verdict |
   Predicate`.
2. Every non-`holds`, non-`builder-side`, non-`already-reviewed` row carries a
   finding ID, and every finding ID has a terminal disposition in
   `spec/audit/review-register.md`: `Resolved`, `Scheduled-roadmap` (with a
   matching `ROADMAP.md` section), `Closed-P3`, or `Deferred-by-user`.
3. All thirteen pre-review candidates are resolved to `holds` or a finding; none
   is left "unverified".
4. Zero P0 findings remain unfixed. Each P1 is on `ROADMAP.md` in admission-rule
   shape (1–3 bullets plus one `**Trigger:**`); `check-roadmap` passes. If Phase
   3 shows more P0s than the bounded fix set in `D3` allows, stop and amend the
   plan rather than escalating the prose rewrite silently.
5. `worklist.md:94` records U4 as reviewed with its exit evidence, the
   §8↔manifest vocabulary note, the `holonovel/scripts/**` boundary, and the
   next chunk (U5); the exit-evidence sentence at `:201-203` is amended per `D5`;
   the `ROADMAP.md` trigger (`:30-32`) names U5.
6. The gates pass un-piped, each with its exit code captured, **after**
   `aar.md` exists (because `build-order` runs the full `check`, and `check`
   includes `check-loop-artifacts`), in dependency order: `npm run assemble`
   (only if a `spec/` file changed) → `npm run check-registers -- --strict` →
   `npm run check-roadmap` → **`npm run build-order` only if a §5 body or §7.7
   was edited** (`D4`; `D3` forbids both) → `npm run check-fingerprint-sync`
   (the only fingerprint check when `build-order` did not run) → `git add` the
   edited paths then `npm run check-guarded-rule-change` on that index. Then
   `aar.md` is amended with the measured results (loop step 7c), `npm run
   check:fast` prints `check:fast: PASS`, and `npm run session:close` commits.
7. `aar.md` records the row count, the finding count by severity, the class
   assigned to any delta the fix set produces, and the gate results. No push.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-15-unscoped-u4/{plan,tasks,review,aar}.md` | the increment record; `tasks.md` is the execution checklist whose checkboxes are updated as steps close; `review.md` is the 52-row verdict table | L (new content) |
| `spec/audit/review-register.md` | one dated `### 2026-11-15 U4 verification workflows` heading **per disposition section that receives rows** — the parser keys the disposition on the nearest preceding `##` heading and rejects a row under any other `##` (`scripts/lib/register-checks.ts:32-37,57-59`) | S–M |
| `docs/plans/2026-11-10-unscoped-surface-review/worklist.md` | status row `:94` gains exit evidence, the vocabulary note, the boundary note, and the next chunk; `:201-203` (exit evidence) is amended per `D5` | S |
| `ROADMAP.md` | trigger line `:30-32` names U5; a new section only if a P1 finding schedules work | S |
| `spec/05-verification.md` | bounded P0 prose corrections (`D3`); assembled (`EV16`) but not fingerprint-bearing | S |
| `spec/03-build.md` | **conditional** — only if C-12 is a defect, the single stale site corrected (`:742`, step 15) | S |
| `holonovel.md` | regenerated by `npm run assemble` | S |
| `holonovel/holonovel.md` | the reference-implementation mirror `assemble` also writes (`scripts/assemble.ts:19,154-156`) | S |
| `spec/audit/proofread-register.md` | **conditional** — only if a readability warning is accepted rather than fixed | S |
| `CHANGELOG.md` | dated entry, `2026-11-15` | S |
| read-only (not modified) | `scripts/run-gates.ts`, `scripts/lib/gate-manifest.ts`, every `scripts/check-*.ts`, every `scripts/test-*.ts`, `scripts/lib/{script-discipline,script-quality,workflow-hygiene}.ts`, `holonovel/scripts/run-test-suite.ts`, `holonovel/scripts/test-harness-guard.ts`, `.github/workflows/*.yml`, `holonovel/package.json`, `.githooks/*` | — |

Not touched: any gate, harness, or manifest entry (a demonstrated coverage gap is
scheduled, not fixed — `D3`); `holonovel/src/**`; `spec/02-requirements.md`
(a §5 body edit is a P1, not an in-session fix); `spec/07-independent.md`;
`scripts/publish/**` and `.github/workflows/publish.yml` (U5);
`spec/audit/req-coverage.md`.

## Phases and tasks

### Phase 1 — Build the mapping, then read

1. Read `scripts/run-gates.ts` in full (252 lines): both modes' failure
   propagation, the advisory path, `--list`/`--recorded`, and the timing record.
   Record the four contracts the enforcement table states.
2. Read `scripts/lib/gate-manifest.ts:25-292` and capture the gate inventory
   (44 names, 3 full-only, the one `advisory` field and its retirement file at
   `:297-312`). This is the mapping's spine; do not read each gate's body yet.
3. Read `.github/workflows/ci.yml` (56 lines) once and classify each step as
   manifest gate, direct script, or composite chain (`EV10`).
4. Read `holonovel/scripts/run-test-suite.ts` (176 lines) and
   `holonovel/scripts/test-harness-guard.ts` (75 lines): the suite's 56 commands,
   its concurrency and failure aggregation, and the guard's two fixtures.
5. Read `scripts/check-gate-table.ts`, `scripts/check-workflows.ts`, and
   `scripts/lib/{script-discipline,script-quality}.ts` far enough to record what
   each already enforces, so a §8 row can cite an existing predicate instead of
   re-testing it (the "Existing-check discovery" rule).
6. Create `review.md`: header, the enforcement mapping table (`Consumer |
   Anchor | Severity | Contract`), and the 52 numbered verdict rows (`# | Surface
   | Anchor | Verdict | Predicate`) — the verdict table is the file's only
   numbered table.

### Phase 2 — Write the verdicts

7. The 18 §8 blocks, in document order. A block that instructs the builder with
   no repository check (G0a's intake duty, G3's discovery diff, G6's survival
   assertions) is `builder-side`; a block that names a check token, a harness, a
   count, a file, or a gate is a finding when the predicate does not deliver it.
8. Apply C-1, C-4, C-5, C-12, and C-13 to their §8 rows — the five prose
   candidates whose predicate is in the spec or in `index.ts`. Record the resolved
   predicate in the row; do not restate the candidate.
9. Apply C-6, C-7 to the G7/G8 rows; C-10 to G4; C-11 to G0b; C-8 to G5/G6. Each
   resolves to `holds` with a predicate or to a finding with the line pair.
10. The 22 gate rows: one row per root `check-*.ts` plus `run-gates.ts`. For each,
    record (a) the declared role and exit contract from its header, (b) the
    surface that runs it — manifest, hook, publish pipeline, or
    `test:ruleset-gates` — from `EV7`'s classification, and (c) the §8 clause (if
    any) it serves. A check with no running surface is a finding; a check whose
    role header contradicts its exit behaviour is a finding.
11. The 10 harness rows: the 8 root `test-*.ts`, `run-test-suite.ts`, and
    `test-harness-guard.ts`. For each, record what it proves, its wiring, and
    whether a failure reaches a gate (`C-2`, `C-9`). `test:loop-artifacts` and
    `test:holosuite-mutation` are the two expected findings; verify each against
    its exact wiring probe before recording.
12. The 2 CI rows: the `gates` job (15 steps — every step fails the job; the nine
    verification steps hold 16 commands, one of them the manifest gate
    `check:starter-freshness`, so 15 commands are outside the manifest, `C-3`)
    and the `container` job (build + start, which no manifest gate replicates).

### Phase 3 — Triage and fix (`D3`)

13. Rank findings P0–P3 exactly as `AGENTS.md` "Review-loop governance" defines
    them, **by fix surface**: a demonstrated wrong statement in §8 prose is P0
    and fixed in-session; a demonstrated code, harness, or gate-wiring defect is
    P1 and scheduled; P2 needs a demonstrated failure and must be bounded — an
    unbounded P2 is downgraded to P3, so every finding terminates; P3 =
    record-and-close.
14. Apply the P0 corrections. Constraints: no simultaneous edit of Appendix M and
    `scripts/lib/req-checks.ts` / `scripts/validate.ts` (that is the
    self-attesting co-change `check-guarded-rule-change` blocks without a
    register entry); re-read each edited paragraph against the
    **reference-prose** bar (`scripts/validate.ts:639-654` — grade 18, no
    sentence over 45 words, no stacked conditions). Baseline (`EV17`): 0 errors,
    296 warnings, **zero §8 sites** — so the post-edit §8 warning count must stay
    zero and the total must not rise. After the last §8 hunk run `npm run
    assemble && npm run validate:sdd` and confirm both counts. A pre-existing
    baseline failure (a red `check:fast`, a stale fingerprint) is fixed first as
    its own commit, never folded into this increment (`AGENTS.md` "Agent
    Operating Routine").
15. **Cross-file atomicity.** If C-12 is a defect, correct the stale side in one
    step: `spec/03-build.md:742` records the ruleset-free skip in "(5)", while
    §9's section definition (`spec/06-artifacts.md:16-19`) places verification
    evidence in (6) and rows H10/H12 (`:55`, `:57`) place their own records
    there. Correct `:742` to (6) **if** Phase 2 settles that the skip is evidence
    rather than a waiver; if the phase-2 read settles the reverse, record the
    finding and schedule it. Do **not** edit §9 (`spec/06-artifacts.md` is U5's
    surface) or the H rows: those are read-only corroboration, and a half-fix is
    never acceptable. The same rule applies to any other contradiction the
    review demonstrates between §8 and a second prose site. Do **not** edit
    `spec/02-requirements.md`: a §5 body correction is P1 and scheduled, because
    it drags `build-order` and the coverage surface into a review increment.
16. Write the register entries with one dated `### 2026-11-15 U4 verification
    workflows` heading per disposition section that receives rows; each row cites
    the predicate (`file:line`) that settles it. Scheduled rows get their
    `ROADMAP.md` section in the same step (`check-registers --strict` couples
    them).

### Phase 4 — Bookkeeping, AAR, gates, close

The loop's order (`docs/plans/README.md:43-50`) puts the AAR (7b) before the
close (7d), and `build-order` runs the full `check`, which includes
`check-loop-artifacts` — that gate reads `aar.md`. Steps 18–19 are therefore
AAR-then-gates, and step 20 amends the AAR with the measured results.

17. Update `worklist.md:94` with U4's exit evidence, the §8↔manifest vocabulary
    note (`D5`), the `holonovel/scripts/**` boundary, and the next chunk (U5);
    amend the exit-evidence sentence (`:201-203`); update this directory's
    `tasks.md` checkboxes; edit the `ROADMAP.md` trigger to name U5.
18. Write the `CHANGELOG.md` entry dated `2026-11-15`.
19. Write `aar.md` (row count, findings by severity, dispositions, delta class)
    ending `LOOP PAUSED`; the gate-results block is a **placeholder** until step
    20 fills it (loop step 7c). If the AAR earns `LOOP OPEN`, disposition the
    named item first and re-run — the close refuses `LOOP OPEN`.
20. Run the gates un-piped, capturing each exit code, **now that `aar.md`
    exists**, in dependency order: `npm run assemble` (only if a `spec/` file
    changed) → `npm run check-registers -- --strict` → `npm run check-roadmap` →
    `npm run build-order` **only if** a §5 body or §7.7 was edited (`D4`) →
    `npm run check-fingerprint-sync` → `git add` the edited paths, then `npm run
    check-guarded-rule-change` against that index. That guard is a **negative
    confirmation** here: it fires only on an Appendix M + validator co-change,
    which this increment avoids. If `build-order` ran and a full-only gate
    (`check-container-image`, `playability`, `test:pipeline`) could not run in
    this environment, record it as an environment Unknown in the AAR; a
    full-only gate that ran and failed on an untouched surface is a pre-existing
    baseline failure fixed first as its own commit, never folded in. If
    `build-order` was skipped, those gates were never attempted and need no note.
21. Amend `aar.md` with the measured gate results (loop step 7c), run `npm run
    check:fast` un-piped to `check:fast: PASS`, then `npm run session:close`.
    The close owns the commit split: one commit, because the fix set touched
    `spec/05-verification.md` (`AGENTS.md` "Split limits").

## Decisions

- **D1 — Unit and boundary.** One verdict row per §8 block (18), per root
  `check-*.ts` (21), per root `test-*.ts` (8), for `run-gates.ts`, for the two
  named server scripts, and per CI job (2): 52 rows. The worklist's declared code
  surface (`worklist.md:194-197`) is exactly that set, which is why the other
  manifest gates are **row-free by design**: `lint`, `validate`, `validate-readme`,
  `surface-budget`, `surface-replay`, `tool-definitions-lint`,
  `tool-citation-check`, `action-conflicts`, `check:conformance`,
  `check-world-provider`, `check-adventure-index`, `check-tool-definitions-sync`,
  `check-vendor-manifest`, `check-starter-freshness`, `playability`,
  `test:data-dir`, and the `detect-dupes` scan are enforced through their own
  scripts and the generated gate table, not reviewed here; their reachability is
  already gated by `check-gate-table` and `check-script-quality` (C1). A gate in
  that list is named only when a §8 workflow cites it. `holonovel/scripts/**`
  beyond `run-test-suite.ts` and `test-harness-guard.ts` is U6's surface, and
  `publish.yml` is U5's; both are recorded as boundary notes in the mapping
  table, never as rows.
- **D2 — Verdict vocabulary and finding IDs.** `holds`, `finding:<ID>`,
  `builder-side`, `already-reviewed:<chunk>` (worklist `D4`); a finding ID is
  `F-U4-<n>`, numbered in the order the row appears in `review.md`, so the row
  and its register entry carry the same token.
- **D3 — Fix policy.** P0 in-session, bounded to §8 prose and, for a
  demonstrated cross-file contradiction, the single other prose site that states
  the contradictory claim (`D5`-style atomicity, step 15); P1 scheduled with a
  dated trigger — that covers a code, harness, manifest, or CI defect, because
  review increments do not become gate-change increments; P2 only with a
  demonstrated failure, bounded, otherwise downgraded to P3; P3
  record-and-close. No gate, harness, manifest entry, or CI step is added or
  edited in this increment.
- **D4 — Fingerprint and assembly boundary.** §8 is assembled (`CORE_FILES`,
  `EV16`) and is not fingerprint-bearing (`DATA_SECTIONS` is §7.7). A §8 edit
  therefore requires `assemble` but not `build-order`; a §5 body or §7.7 edit
  would require `build-order`, and `D3` forbids both, so `build-order` normally
  does not run and `check-fingerprint-sync` is the only fingerprint check.
- **D5 — The §8↔manifest vocabulary, and the amended exit evidence.** §8 names
  nine verification workflows (`G0a`, `G0b`, `G2`–`G8`; `spec/05-verification.md:12-22`),
  not repo commands; it contains no `npm run` line (`EV11`), and it addresses a
  builder. Only `G4` and `G5` have a repository harness in this tree (the `test:*`
  gates and the Pattern Buffer suites), `G2` and `G7` have partial
  implementations, and the rest are builder-side. The manifest's 44 gates are the
  reference implementation's internal checks. They are different vocabularies that
  meet only where a workflow is implemented as a harness. The worklist's "§8
  command list matches `npm run gates -- --list`" clause has no target and is
  amended at step 17 to the mapping this chunk can evidence: every `G` workflow
  resolves to a harness, a gate, or a recorded `builder-side` declaration. The
  clause was mis-specified at program-design time; U4 is not relaxing it.
  Inventing a command list in §8 to satisfy a worklist sentence would add
  normative prose the spec does not need.
- **D6 — Already-reviewed and boundary blocks.** No §8 block is
  `already-reviewed`; the engine contract and §5.9/§5.19 are outside this chunk.
  `holonovel/scripts/**` harness correctness is `already-reviewed` only where
  the sweep's citation resolution covered it (worklist `:71-72`); U6 owns the
  fixtures, so a harness whose *fixture* is wrong is U6's finding, not U4's. A
  harness whose *wiring* is wrong is U4's.
- **D7 — No new dependency, no gate change, no runtime change.** The increment
  adds no package, edits no gate, harness, manifest entry, or workflow, and
  changes no runtime path. This also settles the "Existing-check discovery" rule
  trivially: no check is added, so no existing coverage can be duplicated.

## Open questions

1. **Is the CI-vs-manifest gap a defect or an intended split?** `C-3` measures
   15 non-manifest commands across nine verification steps, ten of them `npm run`
   composites. The answer is decidable rather than judgemental: a command outside
   the manifest is unreachable from `check`/`check:fast`, so a green local
   session does not imply a green CI, and `gate-cost-report` cannot see its cost.
   If Phase 2 finds no statement of the split (AGENTS.md describes the manifest
   as the gate list, not as the CI list), it is a coverage finding with a bounded
   fix (schedule the wiring or record the split). No user decision is required.
2. **Is G4's `scripts/test_N` naming normative?** `C-4` decides whether §8 `:99`
   is a P0 prose defect (zero files follow it) or an illustrative example that
   should be restated in the tree's actual convention. The probe is the REQ-150/
   REQ-141m bodies plus Appendix M's rule on normative naming; if the text is
   genuinely ambiguous, the fix states the convention the tree uses
   (`scripts/test-*.ts` and `holonovel/scripts/test-*.ts`) rather than inventing
   files. No user decision is required.
3. **Does a demonstrated gate-coverage defect belong in this increment?** `D3`
   schedules it (P1) rather than fixing it, on the U2/U3 precedent that a review
   chunk does not become a code-change chunk. There is no in-session code-fix
   exception; each finding is scheduled with a dated trigger and its evidence
   recorded.
