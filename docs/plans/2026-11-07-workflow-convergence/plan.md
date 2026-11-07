# Plan — Workflow convergence with Infobroker (ROADMAP item 1)

## Done bar (this session)

**Done bar:** the numbered list below is green, the roadmap item is removed, and split mode is dogfooded; if split mode fails, commit with `--single`, keep the item, and record `LOOP OPEN`.

0. The red baseline is fixed first: `npx tsx scripts/version-check.ts` passes.
   Today it fails because the top `2026-11-07` CHANGELOG entry predates the
   `2026.11.06` CalVer; `npm run version-bump` advances every version
   reference to `2026.11.07` as its own commit (commit 0), before feature work.
1. `npm run status` exists and prints upstream, unpushed count/age, last
   publish, version vs tag, and open roadmap count; exits 0 with no upstream.
2. `.githooks/commit-msg` rejects a subject that is not
   `YYYY-MM-DD — <title>`, exceeds 120 characters, or ends in a period; the
   two legacy-engine subject forms are fixed so the backout path keeps working.
3. `AGENTS.md` and `docs/workflow-cadence.md` carry the Agent Operating Routine
   mapped to Holonovel commands.
4. The publish path refuses a staged secret, a deny-listed artifact, a
   leftover (unstaged/untracked) path after staging, and a missing git
   identity; the same guards run in `session:close`. All are tested.
5. The pipeline harness rehearses partial ranges (`--stage`, `--from`,
   `--only`) and proves a bounded run either passes or fails loudly, never
   exits 0 after silently skipping work that needs earlier state.
6. CI actions are pinned to full SHAs with version comments;
   `check-workflows` enforces that pin form and `npm run test:workflows`
   covers the parser. The duplicate `Typecheck` step is gone from `ci.yml`
   (`npm run check` already gates it).
7. Atomic commits: a spec increment stays one commit; a non-spec session is
   split by concern, with docs/CHANGELOG last. `session:close` plans and
   applies the series, typechecks each committed tree that touches code, and
   asserts the final `HEAD^{tree}` equals the tree the fast suite passed on.
   The planner is tested by `npm run test:commit-plan`.
8. `npm run check:fast`, `npm run check`, `npm run test:pipeline`,
   `npm run check-roadmap`, `npm run check-gate-table`,
   `npm run check-script-discipline`, `npm run check-script-quality`, and
   `npm run typecheck` pass. The roadmap section is removed, the CHANGELOG and
   DECISIONS entries are written, `docs/plans/2026-11-07-workflow-convergence/`
   holds plan/tasks/AAR, and the AAR ends with a LOOP token.

If split mode cannot be made green, the session is not done: commit the work
with `--single`, keep the roadmap item, and record the failure as a P0 in the
AAR (`LOOP OPEN`).

## Evidence (current state, verified this session)

- **Baseline is red:** `npx tsx scripts/version-check.ts` exits 1 — root
  version `2026.11.06` predates the latest CHANGELOG entry `2026-11-07`
  (REQ-107a). `scripts/version-bump.ts` targets the later of the two and
  rewrites root/server `package.json`, both lockfiles, `holonovel/AGENTS.md`,
  `holonovel/DECISIONS.md`, `holonovel/src/index.ts`, and `server.json` in one
  deterministic run.
- `package.json` has no `status` script; `.githooks/` contains only
  `pre-commit` and `pre-push`; `git config --get core.hooksPath` returns
  `.githooks`, so a new hook file is active without an install step.
- `scripts/publish/steps.ts` `stage` only runs `git add -A` and resets the
  wiki path; `scripts/publish/preflight.ts` checks branch/staged/untracked/
  deploy but not git identity; `scripts/session-close.ts` stages with
  `git add -A` and commits with no guard.
- No existing secret scan, deny-list, leftover check, or identity guard exists
  in `scripts/` or `.githooks/` (`grep` over both trees returned no match).
- `scripts/check-workflows.ts` `actionMajor()` treats a SHA pin as a violation
  (`major === null` → "not a major-version pin"), so adopting SHA pins requires
  a parser change first.
- `.github/workflows/ci.yml` runs `npm run check` and then a separate
  `Typecheck` step; the gate manifest lists `typecheck` as a fast/full gate, so
  the step is a duplicate. `actions/checkout@v5` and `actions/setup-node@v5`
  are major pins today.
- `scripts/test-push-pipeline.ts` has four cases and exercises only
  `--only push_repo`; no stage/from/only matrix and no guard failure case.
  The four existing cases are the reconciliation baseline: they set a fixture
  identity, stage clean content, and do not run `stage` in case 4, so the new
  guards must leave all four unchanged.
- `scripts/lib/gate-run-manifest.ts` keys a run on the index tree plus the
  unstaged/untracked hash, not on HEAD, so a run recorded on the final staged
  tree remains valid for the final commit of a split series.
- Current fast-suite cost from `.holonovel-state/gate-timing.json`: 34 gates,
  ~93 s wall time for the latest run (one run per session, not per split
  commit).
- Dry run of the proposed deny-list and secret patterns over tracked content:
  0 denied tracked paths, 0 secret hits outside `scripts/ruleset-builds/`.

## Scope

In scope: roadmap item 1 only (status, commit-msg, routine, stage guards,
partial-range rehearsal, CI pinning/dedup, atomic commits, docs).

Out of scope: deleting the legacy pipeline engine, the real-publish rehearsal,
and the hazard annotation item (roadmap items 2 and 3). The legacy engine's
subject strings are fixed here only so the new hook does not break the
backout path.

## Workstreams

### 0. Baseline fix: CalVer currency (S)

- Run `npm run version-bump`; it advances to `2026.11.07` and rewrites every
  version reference (REQ-107a). Verify with `npx tsx scripts/version-check.ts`.
- Commit as commit 0, subject `2026-11-07 — Version bump: 2026.11.07`, before
  any feature edit. This is a red-baseline fix, never folded into feature work.

### 1. `npm run status` (S)

- New `scripts/status.ts` (role `[informational]`, shebang, `handleHelp`,
  `import.meta.dirname`). Port Infobroker's `scripts/status.ts` with
  Holonovel fields:
  - `upstream`, `unpushed commits`, `oldest unpushed` via `@{u}`;
  - `last publish` from `.holonovel-state/publish-run.json` (`started`), or
    `never recorded`;
  - `version` from `package.json`, `latest tag` from
    `git describe --tags --abbrev=0`;
  - `open roadmap` = `^## ` headings minus `## Non-goals` (same rule as
    `check-roadmap`).
  - One hint line when unpushed > 0: `npm run session:close` if the tree is
    dirty, then `./scripts/push-pipeline.sh`.
  - Every source is wrapped in a `safe()` fallback; always exit 0.
- Add `"status": "npx tsx scripts/status.ts"` to `package.json`.

### 2. `commit-msg` hook (S)

- New `.githooks/commit-msg` (role `[gate]`, `#!/usr/bin/env bash`,
  `set -euo pipefail`, exit 0/1/2, executable bit set).
  - Skip `Merge *`, `Revert *`, and empty subjects.
  - Reject a subject not matching `^[0-9]{4}-[0-9]{2}-[0-9]{2} — .+`.
  - Reject length > 120 (max observed new-style subject is 99; a bucket
    label can add ~20, so 100 would reject legitimate split subjects).
  - Reject a trailing period.
  - Reject a leading `## ` with a message pointing at the legacy fix.
- Fix `scripts/push-pipeline-legacy.sh` line 594 to strip the `## ` marker
  from the CHANGELOG heading, and its fallback at line 603 to
  `"$COMMIT_DATE — Push pipeline"`, so `PUSH_ENGINE=legacy` still commits.
- Add `.githooks/commit-msg` to the CI `shellcheck` invocation and the
  AGENTS shellcheck list.

### 3. Agent Operating Routine (S)

- Add an "Agent Operating Routine" section to `AGENTS.md` immediately before
  "Script discipline" with the standing mappings:
  - **"commit"** → `npm run session:close` (auto-split; report the commit
    list; stop on a failing tree).
  - **"push"/"ship"** → `./scripts/push-pipeline.sh`; a bare "push" is
    explicit authorization to publish.
  - **"plan"/"build"** → `npm run status` + `npm run check:fast` baseline
    first; a red baseline is its own commit.
  - **"status"/"what's left"** → `npm run status`.
  - Split limits: a spec increment is one commit; non-spec sessions split by
    concern; ≤5 commits (print the grouping above that); ~300 changed lines
    per commit.
- Update `docs/workflow-cadence.md` step 4 to say the close auto-splits a
  non-spec session and keeps a spec increment atomic.

### 4. Publish stage guards (M)

- New `scripts/lib/publish-guards.ts` (library, header only):
  - `DENY_PATTERNS` covering `node_modules/`, `dist/`, `.holonovel-state/`,
    `config.local.json`, `.env*`, `*.sqlite*`, `*.key|pem|p12|pfx`,
    `id_rsa*`, `*vector-store*.json`.
  - `deniedPaths(paths)`.
  - `SECRET_PATTERNS` (`sk-`, `AKIA`, private-key header, `ghp_`, provider
    key/password assignments); `scanAddedLines(diff)` returns
    `{path, line, kind}` and never the matched value.
  - `leftovers(porcelain)` — every line not matching `^[MARCD] `.
  - `identityMissing(name, email)`.
  - `collectStagedGuards(root)` runs `git diff --cached --unified=0`,
    `--name-only`, `status --porcelain`, and `config user.name/email`, returns
    `{problems: string[], secrets: string[]}` (formatted `path:line [kind]`).
- `scripts/publish/preflight.ts`: add the identity check to `problems`
  (before any write). Keep the existing branch/staged/untracked/deploy checks.
- `scripts/publish/steps.ts` `stage`: after `git add -A` and the wiki reset,
  call `collectStagedGuards`; fail on denied paths, leftovers, secrets, or a
  missing identity. Add `allowSecrets` to `Flags`; `--allow-secrets`
  downgrades a secret match to a warning (diagnostic to stderr, never the
  value).
- `scripts/session-close.ts`: after `git add -A`, call the same collector and
  fail closed (no override). This is the single source of truth for staging
  safety.
- `run.ts`/`push-pipeline.sh`: parse `--allow-secrets` and list it in both
  usage blocks.
- Tests (in `scripts/test-push-pipeline.ts`, full-only `test:pipeline`):
  - fixture secret (`leak.txt`, `sk-<24 chars>`) + `--only stage` → exit 1,
    no commit, output contains `path:line` and not the value;
  - deny-listed `secrets/id_rsa` + `--only stage` → exit 1;
  - identity unset + `--only preflight --no-push` → exit 1, then restore;
  - unit cases for `leftovers()` and `deniedPaths()` with crafted strings;
  - clean fixture → `--only stage` exits 0.

### 5. Partial-range rehearsal (M)

Extend `scripts/test-push-pipeline.ts` beyond `--only push_repo`:

- `--stage repo --no-push` commits but does not tag/push.
- `--from stage` after a failed stage resumes at stage.
- `--only preflight` with a staged change exits 1 before any write.
- `--stage deploy` on an already-published fixture lands the deploy clone and
  reports `deploy=true` without a new commit.
- `--only commit` on a clean index reports `nothing new to commit` (skip).
- Audit every step's read of `ctx.state` and add `ensureSpecHash(ctx)` /
  `ensureDelta(ctx, server)` helpers that compute the value when a bounded run
  skipped `delta` (and return `"stub"` under `ctx.stub`), plus an explicit
  exit-1 precondition for anything that cannot be reconstructed. A bounded
  run must never exit 0 after skipping required state; `--stage deploy`
  therefore passes via `ensureSpecHash`, and a genuinely unset prerequisite
  fails loudly in a harness case.

### 6. CI pinning and duplicate-step removal (S)

- Resolve the full SHAs behind `actions/checkout@v5` and
  `actions/setup-node@v5` with `git ls-remote https://github.com/actions/<name>
  'refs/tags/v5*'` at execution time; record each SHA and the tag comment.
- Replace the `@v5` refs in `ci.yml` and both jobs of `publish.yml` with
  `@<40-hex> # v5.x.y`.
- Update `scripts/check-workflows.ts` + `scripts/lib/workflow-hygiene.ts`:
  - `parseActionPin(line)` accepts a SHA pin with a `# vN` comment and a
    major pin; `test:workflows` covers both forms.
  - The two known actions require a SHA pin (major ≥ 5) once pinned; the
    parser change and the workflow pins land in the same pipeline commit, so
    no checked-out tree has a parser demanding SHA pins while the workflows
    still use major pins.
- New `scripts/test-workflows.ts` (role `[gate]`), wired as `test:workflows`,
  covering: SHA pin accepted, major pin rejected, `# v4` rejected, unknown
  action major accepted, and the existing `jobHygiene` cases.
- Remove the `Typecheck` step from `ci.yml` (the `check` gate already runs
  it). Keep `assemble`, `shellcheck`, audits, server harnesses, holosuite, and
  package smoke — none is in `npm run check`.
- Add `test:workflows` and `test:commit-plan` to
  `scripts/lib/gate-manifest.ts` (fast + full), regenerate the AGENTS gate
  table with `npm run gates -- --list --format=md`, and run
  `check-gate-table`.

### 7. Atomic commits (L)

- New `scripts/lib/commit-plan.ts` (pure):
  - `isSpecIncrement(paths)` — `spec/**`, `holonovel.md`,
    `holonovel/holonovel.md`.
  - Ordered buckets: `pipeline` (`scripts/`, `.githooks/`, `.github/`, root
    `package.json` — the task runner and the pins it names are one atomic
    tooling change), `server` (`holonovel/src`, `holonovel/scripts`,
    `holonovel/bin`, `holonovel/content`, `holonovel/narrative_world_model`,
    tool-definitions, `server.json`), `config` (lockfiles, `tsconfig*`,
    `.markdownlint.json`, `.gitignore`, `holonovel/package.json`), `docs`
    (`README.md`, `CHANGELOG.md`, `AGENTS.md`, `ROADMAP.md`, `docs/`,
    `holonovel/DECISIONS.md`, `holonovel/AGENTS.md`), `misc` fallback.
  - `planCommits(paths, date, title)` — a spec increment is one `increment`
    commit with the plain title; otherwise per-bucket commits
    (`<date> — <title>: <label>`), with `docs` ordered last and carrying the
    plain `<date> — <title>` subject (the release-note commit). Trim and strip
    a trailing period from every derived subject so it always passes the hook.
  - Every input path appears in exactly one bucket; a path matching none goes
    to `misc`, never dropped. Subjects are capped at 120 characters.
- `scripts/session-close.ts`:
  - Flags `--split`, `--single`; default `auto` (`single` for a spec
    increment, `split` otherwise). `--split` on a spec increment is an error.
  - `--dry-run` prints the planned subjects and path counts, exits 0.
  - Read changed paths with `git diff --cached --name-only -z` (NUL split) in
    the guards, planner, and series, so quoted/space/unicode paths stay exact.
  - After guards and `writeGateRun("fast", …)` on the final staged tree:
    - `single`: existing commit path (hooks run).
    - `split`: capture `preHead` and `finalTree = git write-tree`; `git reset
      -q`; for each bucket except the last, `git add -A -- <paths>` then
      `git commit --no-verify -m <subject> -m <one-line body>`; typecheck each
      committed tree that touches `scripts/` or `holonovel/src|scripts` in a
      detached worktree (`git worktree add`, symlink root and
      `holonovel/node_modules`, `npm run typecheck`, remove); stage the last
      bucket and `git commit -F -`
      with the standard message so `commit-msg` and `pre-commit` run (the
      gate-run record matches the final tree).
    - Assert `git rev-parse HEAD^{tree}` equals `finalTree`; on any failure,
      `git reset --soft preHead` and exit 1 with the tree left intact.
- New `scripts/test-commit-plan.ts` (role `[gate]`), wired as
  `test:commit-plan`: spec path forces single; buckets ordered with docs last;
  every path assigned once; unknown path → misc; subject shape/length; empty
  plan → no commits; every planner-generated subject is passed to
  `.githooks/commit-msg` and must exit 0 (the hook stays the authority).
- `--single` remains the escape hatch; the AAR records the mode used.

### 8. Documentation, roadmap, and close (S)

- `docs/publish-pipeline.md`: add a "Staging guards" table (guard, failure it
  prevents, test) and update "Rehearsal status" with the partial-range cases.
- `holonovel/DECISIONS.md`: record two standing decisions — the guard set is
  enforced in both the publish path and `session:close`; split-commit gate
  ownership (fast suite on the final tree, typecheck per code-bearing commit,
  intermediate commits bypass client hooks because the driver owns the gate).
  `check-registers` has no Scheduled-roadmap row for this roadmap item
  (verified: the only Scheduled-roadmap finding is the hazard item), so the
  ROADMAP removal needs no review-register update.
- `CHANGELOG.md`: new top `## 2026-11-07 — Workflow convergence: status,
  staging guards, and atomic commits` entry.
- `ROADMAP.md`: remove the "Workflow convergence with Infobroker" section.
- `docs/plans/2026-11-07-workflow-convergence/{plan,tasks,aar}.md`; AAR ends
  `LOOP PAUSED` or `LOOP OPEN`. Write the AAR before the final full
  `npm run check` so `check-loop-artifacts` sees it.
- Run `npm run session:close` (split mode) to dogfood the new mechanism.

## Blast radius

| File | Change | Size |
|---|---|---|
| `package.json`, `holonovel/package.json` | CalVer bump to 2026.11.07 (commit 0) | S |
| `package-lock.json`, `holonovel/package-lock.json` | lockfile versions (commit 0) | S |
| `holonovel/AGENTS.md`, `holonovel/DECISIONS.md`, `holonovel/src/index.ts`, `holonovel/server.json` | version references (commit 0) | S |
| `scripts/status.ts` | new informational status report | S |
| `package.json` | `status`, `test:workflows`, `test:commit-plan` scripts | S |
| `.githooks/commit-msg` | new subject gate | S |
| `scripts/push-pipeline-legacy.sh` | strip `## `, date-stamped fallback | S |
| `AGENTS.md` | routine, gate table, shellcheck list | M |
| `docs/workflow-cadence.md` | auto-split close | S |
| `scripts/lib/publish-guards.ts` | new pure guard library | M |
| `scripts/publish/preflight.ts` | identity guard | S |
| `scripts/publish/steps.ts` | stage guards + `--allow-secrets` | M |
| `scripts/publish/run.ts` | `--allow-secrets` flag | S |
| `scripts/push-pipeline.sh` | `--allow-secrets` usage | S |
| `scripts/session-close.ts` | guards + split-commit execution | L |
| `scripts/lib/commit-plan.ts` | new pure planner | M |
| `scripts/test-push-pipeline.ts` | guard + partial-range cases | M |
| `scripts/check-workflows.ts`, `scripts/lib/workflow-hygiene.ts` | SHA-pin parser | M |
| `scripts/test-workflows.ts` | new parser/hygiene self-test | S |
| `scripts/test-commit-plan.ts` | new planner self-test | S |
| `scripts/lib/gate-manifest.ts` | two new gates | S |
| `.github/workflows/ci.yml`, `publish.yml` | SHA pins, drop typecheck, shellcheck hook | S |
| `docs/publish-pipeline.md` | guard matrix, rehearsal status | S |
| `holonovel/DECISIONS.md` | standing decisions | S |
| `CHANGELOG.md`, `ROADMAP.md` | entry, remove item | S |
| `docs/plans/2026-11-07-workflow-convergence/*` | plan/tasks/AAR | S |

Rollback cost: 1 (reversible edits; no schema or remote state). Commit series
(this session is non-spec, so it must split):
0. Baseline: `npm run version-bump` output (root/server `package.json`, both
   lockfiles, `holonovel/AGENTS.md`, `holonovel/DECISIONS.md`,
   `holonovel/src/index.ts`, `server.json`). Gate:
   `npx tsx scripts/version-check.ts` + `npm run check:fast`.
1. `pipeline` bucket — tooling, hooks, guards, planner, tests, package
   scripts, gate manifest, and `.github/workflows/*`. Gate:
   `npm run typecheck`, `test:workflows`, `test:commit-plan`,
   `test:pipeline`, `npm run check-workflows`.
2. `docs` bucket (last) — AGENTS, docs, DECISIONS, CHANGELOG, ROADMAP, AAR.
   Gate: full `npm run check` before the series; `check-roadmap`,
   `check-loop-artifacts`, `check-gate-table` after the docs commit.

## Edge cases and rollback

- No upstream / no tags / no publish record → `status` prints `unavailable`
  or `never`; never fails.
- commit-msg on merge/revert/empty → skip; missing message file → exit 2.
- Secret false positive in docs → `--allow-secrets` on the publish path; the
  report is `path:line`, never the value. `session:close` has no override by
  design.
- Deny-list over a legitimately tracked path → the pre-implementation dry run
  found none; if one appears, add a reviewed exception to the pattern list,
  not a force-add.
- Leftover after `git add -A` → the stage step and session-close fail before
  commit; the tree stays intact.
- Missing git identity → preflight fails before any write; the harness case
  restores the fixture identity.
- Bounded run with unset state → explicit exit-1 precondition message; the
  harness asserts it.
- Split commit fails mid-series → `git reset --soft preHead`; working tree and
  index restored; no half-series in history.
- Final tree hash mismatch → same soft reset; exit 1.
- `git worktree` typecheck fails → abort the series with the soft reset; the
  failing tree is inspectable in the scratch directory.
- Emergency backout if `session:close` itself is broken: `git commit -F -`
  with the CHANGELOG message, record the deviation in the AAR.

## Alternatives considered

- **SHA pins + `check-workflows` parser update vs. keep major pins.** Major
  pins are mutable and were the roadmap's target. A parser update is required;
  `test:workflows` covers the new form.
- **Per-commit full fast suite vs. final-tree suite + typecheck per commit.**
  A full suite is ~93 s; four buckets would add ~6 min per session. The chosen
  split keeps one fast suite on the exact final tree (hash-asserted) and
  typechecks each code-bearing commit. The tradeoff is recorded in DECISIONS.
- **`--no-verify` for every split commit vs. hooks on the final commit.** The
  final commit runs hooks normally; only intermediates bypass them because the
  driver has already run the suite and validates subjects with the planner's
  rules.
- **Extend `session-close` vs. a new `split-commit` entry point.** Extending
  the existing entry point avoids two commands that can disagree; the planner
  is a tested library.
- **Standalone guard gate vs. harness cases.** The guards are pure; the
  hermetic harness already exercises the pipeline. No third new gate.

## Verification

Run, in order:

1. `npm run test:workflows` and `npm run test:commit-plan`.
2. `npm run test:pipeline` (guards + partial ranges).
3. `npm run check:fast`, then `npm run check`.
4. `npx tsx scripts/version-check.ts` (green after commit 0; the top entry and
   CalVer both read 2026.11.07).
5. `npm run check-roadmap`, `npm run check-gate-table`,
   `npm run check-script-discipline`, `npm run check-script-quality`,
   `npm run check-loop-artifacts`, `npm run typecheck`.
6. Manual hook cases:
   - `printf 'bad subject\n' > /tmp/m && .githooks/commit-msg /tmp/m` → exit 1;
   - `printf '2026-11-07 — Valid subject\n' > /tmp/m && .githooks/commit-msg /tmp/m`
     → exit 0.
7. `npm run status` (before removing the roadmap item: 3 open; after: 2).
8. `npm run session:close` (split mode), then `git log --oneline -5` to
   confirm the series and subjects.

## Trust boundary

All inputs are repo files. Action SHAs are resolved from
`git ls-remote https://github.com/actions/*` (tool output); the plan pins the
resolved SHA and records it in the run log. No web instructions are embedded.

## Risks / conditions / unknowns

- **C-1:** The resolved `v5` SHAs must match the actions the workflows
  currently use; confirm each SHA's tag comment before replacing the ref.
- **C-2:** Fast-suite cost per session stays ~93 s; if a split-series
  typecheck pushes a session past the gate budget, record the measured cost
  in `spec/audit/gate-timing.json` context and keep `--single` available.
- **C-3:** Verify the legacy-engine subject fix in a scratch fixture without a
  real publish.
- **C-4:** Commit 0 must be the only version bump; re-run
  `version-check` after commit 0 so a later edit cannot silently reintroduce
  a mismatch.
- **Unknown:** whether any step besides `record`/`verify_deploy` reads state
  that a bounded run cannot reconstruct; the rehearsal matrix must enumerate
  every step's `ctx.state` reads before claiming done.
