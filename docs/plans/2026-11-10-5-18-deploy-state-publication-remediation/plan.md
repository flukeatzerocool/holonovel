# Plan — §5.18 deploy, state, and publication remediation (F-P6b-8, F-P6b-13, F-P6b-14, F-P6b-19)

Status: revised after cold review and two re-reviews (0 blockers open; 2 textual
majors applied after the re-review cap) · Kind: planned · Depth: deep
Review independence: fresh (cold artifacts: `/tmp/opencode/plan-cold-review.md`,
`/tmp/opencode/plan-cold-rereview.md`, `/tmp/opencode/plan-cold-rereview-2.md`)

Conditions to resolve during execution (build-review §6 verifies each):

- **C-1** — The T491 case must produce a genuinely divergent pair (bare remote
  advanced *and* a local deploy-clone commit); a local-only commit leaves
  `git pull --ff-only` "Already up to date" and the notice unobserved.
- **C-2** — `holonovel/schemas/PROVENANCE.md` must record 24 keys
  (8 annotations, 2 containers, 14 assertions), not 24-1 and not the instance
  keys under `example`/`examples`.
- **C-3** — `test-push-pipeline.ts`'s `runPipeline` helper must accept an
  environment parameter for `HOLONOVEL_PIPELINE_STUB=1`; extend it if it does
  not.

## 1. Objective

Close the first open `ROADMAP.md` section, **§5.18 deploy, state, and
publication remediation (P1)**, by making the four named contracts real:

- A server whose persistent state sits inside a git work tree says so —
  `[state-in-tree]` in `spec_health` and on stderr — and the four repo entry
  scripts stop hardcoding `holonovel/.holonovel-state` (REQ-397).
- A publish deploy refuses a checkout/clean that would actually touch state,
  names the server on a fast-forward failure, and never reports a stubbed
  verification as a completed deploy (REQ-396, REQ-418).
- Delta classification fails closed when no published spec hash resolves
  instead of reading the working copy of `DECISIONS.md` (REQ-394).
- The distribution carries a container image that starts the host, and
  `server.json` is validated against its registry schema rather than checked
  for version equality alone (REQ-428).

**Scope statement (one register).** The roadmap trigger is finding-based, so
the section closes when F-P6b-8, F-P6b-13, F-P6b-14, and F-P6b-19 are
`Resolved` in `spec/audit/review-register.md` with a `file:line` exercising
assertion. No REQ body changes, so no new spec text is claimed.

**Done bar:** the four findings are `Resolved` with a cited assertion; the
roadmap section is removed; `npm run assemble`, `npm run check:fast`,
`npm run check`, `npm run test:pipeline`, and `npm run test:package-smoke`
pass; `npm run build-order` is clean; T466, T465, T491, T462, and T510 each
run an assertion that fails on the pre-fix tree; the AAR ends `LOOP PAUSED`.

## 2. Verified baseline

- `npm run status`: 40 unpushed commits, 17 open roadmap items, version
  `2026.11.10`, last publish `2026-11-09T04:30Z`.
- `npm run check:fast`: exit 0, `check:fast: PASS`, 38/38 gates.
- F-P6b-8 predicate (confirmed by reading):
  - `holonovel/src/core/data-dir.ts:60-61` returns an existing legacy
    `<packageRoot>/.holonovel-state` with no signal to the caller.
  - `grep -rn 'state-in-tree' holonovel/src` → 0 hits; only the spec, the
    review register, and the roadmap contain the token.
  - Four repo entry scripts bypass the resolver:
    `scripts/build-ruleset.ts:26`, `scripts/update-rulesets.ts:20`,
    `scripts/migrate-user-data.ts:21`, `scripts/update.ts:50` — each
    `process.env.TTRPG_DATA_DIR ?? join(root, "holonovel", ".holonovel-state")`.
  - Fifth site: `scripts/lib/ruleset-build-kit.mjs:212` derives the ruleset
    install dir from `repoRoot/holonovel/.holonovel-state/rulesets`.
  - The shipped CLI already routes correctly: `holonovel/src/cli/update.ts:88`
    calls `resolveDataDir`.
- F-P6b-13 predicate:
  - `scripts/publish/steps.ts:585-588` runs `git checkout -- .` and
    `git clean -fd` in the deploy clone with no state-path assertion. The
    block is entered only when `git status --porcelain` is non-empty
    (`:585`), which ignores gitignored files.
  - `scripts/publish/steps.ts:591` fails with `deploy pull could not
    fast-forward` — the message names no server.
  - `scripts/publish/steps.ts:620-624` (the `ctx.stub` branch of
    `verify_deploy`) sets `ctx.state.didDeploy = true` and returns `"pass"`,
    so `scripts/publish/run.ts:217` prints `deploy=true` for a run that
    verified nothing.
  - `/home/fluke/Holonovel-deployed/holonovel/.holonovel-state` exists and is
    **gitignored** (`git -C /home/fluke/Holonovel-deployed check-ignore -v`
    → `.gitignore:7:.holonovel-state/`), so `git clean -fd` (no `-x`) does
    not remove it and a `checkout -- .` cannot revert it. The live deployment
    is therefore safe today; a guard must not refuse it.
- F-P6b-14 predicate:
  - `scripts/spec-delta.ts:136-139` reads `**Spec hash:**` from the working
    copy of `DECISIONS.md` and assigns
    `report.stored_hash = lastPublishedStoredHash(baseRef) ?? workingStored`.
    A hand-edited line therefore changes the classification basis.
  - The publish consumer calls `--report-only`
    (`scripts/publish/steps.ts:116`), so a change to the exit code alone
    cannot protect publication; the consumer must read an explicit field.
- F-P6b-19 predicate:
  - No container image exists: `find . -maxdepth 3 -iname 'Dockerfile*'` → 0
    results; `grep -rn docker .github/workflows package.json scripts/` → 0
    results.
  - `scripts/version-check.ts:92-103` compares `server.json` version strings
    and nothing else. No JSON-schema validation exists anywhere in `scripts/`.
  - `holonovel/server.json` names
    `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`.
    The fetched schema is 22,090 bytes, draft-07, and uses 24 keys (measured
    by walking the schema's structural objects — `definitions`, `properties`,
    `items`, `anyOf`/`allOf`/`not`, and both `additionalProperties` forms — and
    excluding the instance documents under `example`/`examples`, which are data
    and not schema): **annotations** `$schema`, `$id`, `$comment`, `title`,
    `description`, `example`, `examples`, `default`; **containers**
    `definitions`, `properties`; **assertions** `$ref`, `type`, `required`,
    `additionalProperties` (boolean **and** object form), `items` (object form
    only), `enum`, `const`, `pattern`, `format` (`uri` only), `anyOf`, `allOf`,
    `not`, `minLength`, `maxLength` — 8 + 2 + 14.
    `ServerDetail.required` is `["name","description","version"]` — `packages`
    is optional.
- Existing harnesses: **T466** has no title (`grep -rn 'T466' holonovel/scripts
  scripts` → 0 hits); **T465** and **T491** have no title; **T462** is titled
  at `holonovel/scripts/test-update-workflow.ts:292,305`; **T510** is titled at
  `holonovel/scripts/test-tool-definitions.ts:509,515`. `test:data-dir`
  (`holonovel/scripts/test-data-dir.ts`, 127 lines) and `test:update-workflow`,
  `test:tool-definitions`, `test:starter-novel` exist only in
  `holonovel/package.json` — the root `package.json` defines no wrapper, and
  `scripts/lib/gate-manifest.ts:22-23` runs root `npm run <script>`.
  `test:pipeline` is full-tier only (`scripts/lib/gate-manifest.ts:256-261`).

## 3. Decisions

- **D1 — One resolver, one location descriptor, additive warning.**
  `resolveDataDir` keeps its signature and mkdir behavior (REQ-613 callers
  unchanged); a new `locateStateDir` returns
  `{ dir, source, inGitWorkTree, workTreeRoot }` and never creates. Rejected: a
  warning flag threaded through `resolveDataDir`, which would make every
  caller handle it and risk a behavior change in the shipped CLI. The legacy
  directory is still honored and never migrated; the warning is informational
  and non-blocking.
- **D2 — Warn on every in-tree resolution, not only the legacy branch.**
  REQ-397's guarantee is about the resolved location, not how it was chosen, so
  an explicit `TTRPG_DATA_DIR` inside a work tree warns too. Rejected: warning
  only for the legacy default, which would miss the operator misconfiguration.
- **D3 — The deploy guard tests "would this checkout/clean touch state?", not
  "is a state path inside the deploy tree?".** The candidate list (each
  server's no-create resolved data dir, `TTRPG_RULESET_DIRS`, and
  `TTRPG_DATA_DIR`) is classified with git: a candidate that is **tracked**
  would be reverted by `checkout -- .`; an **untracked, non-ignored** candidate
  would be deleted by `clean -fd`; an **ignored or absent** candidate is safe
  and produces only an advisory line. Rejected two alternatives: a fixed
  candidate list filtered by "inside the deploy root" (tautological — the
  candidates are constructed there), and refusing on any in-tree state (it
  would brick the live deployment, whose state is gitignored and survives
  both commands, and D1 forbids migrating it).
- **D4 — Delta classification reports a missing baseline explicitly, and the
  consumer enforces it.** `spec-delta.ts` emits `baseline_missing: true` and
  `stored_hash_source` and, outside `--report-only`, exits 1.
  `classifyDelta` (`scripts/publish/steps.ts:110-133`) throws when
  `parsed.baseline_missing` is true — the exit code is not the mechanism,
  because it invokes `--report-only`. Classification also stays `major` when
  the baseline is missing, so a second consumer cannot read a patch. Rejected:
  keeping the fallback but flagging it, which still classifies against a value
  an operator can hand-edit.
- **D5 — Vendor the registry schema; no new dependency.**
  The schema uses 24 keys, of which eight are annotations, two are containers,
  and fourteen are assertions; all are implementable in ~240 lines. The
  validator asserts its own coverage: every key in the vendored schema must be
  in one of the three named sets, so a future schema refresh fails loudly
  instead of validating partially. Object-valued `additionalProperties`,
  `minLength`, and `maxLength` are implemented, not skipped. Rejected: adding
  `ajv` (a new dependency in a zero-runtime-dependency tooling tree) and
  rejected a hand-written field allowlist (drifts from the published schema).
- **D6 — Vendor the schema byte-identically; keep provenance beside it.**
  `holonovel/schemas/mcp-server.schema.json` is a byte-for-byte copy (the file
  already carries a `$comment`), and `holonovel/schemas/PROVENANCE.md` records
  the URL, fetch date, and sha256. Rejected: rewriting `$comment` in place,
  which would make the vendored bytes unverifiable against the upstream
  document.
- **D7 — The container gate is full-tier, tool-conditional locally, and
  unconditional in CI.** `check-container-image` builds and runs the image when
  `docker` is present, prints a notice and passes otherwise (the `shellcheck`
  precedent in `check-script-discipline`). It is full-tier only, beside
  `test:pipeline`, because two `npm ci` stages dominate `check:fast`. A CI job
  builds and runs it unconditionally. Rejected: a fast-tier image build, which
  would make the gate-cost report nominate its own new gate.
- **D8 — No spec body changes, so no fingerprint advance.** The work is
  implementation and tooling only. No tool action, parameter, or output
  contract changes, so no sibling REQ owns a conflicting contract. The
  §5.9/§5.16–§5.17/§5.19 fingerprint-gated sections are untouched, so
  `check-fingerprint-sync` is a no-op; the coverage register is still
  regenerated because new assertions change REQ evidence membership.

## 4. Workstreams

Every new script declares its role in the header (`[gate]`), carries a
shebang, uses exit codes 0/1/2, implements `--help` where it takes flags, and
is wired into a `package.json` script and `scripts/lib/gate-manifest.ts`
(`check-script-discipline`, `check-script-quality`, `check-gate-table`).

### W1 — REQ-397 untracked state location (F-P6b-8)

1. `holonovel/src/core/data-dir.ts`:
   - `StateDirLocation = { dir: string; source: "env" | "legacy" | "user-data"; inGitWorkTree: boolean; workTreeRoot: string | null }`.
   - `locateStateDir(packageRoot, options): StateDirLocation` — no creation,
     same precedence as today. `DataDirOptions` gains
     `isGitMarker?: (candidate: string) => boolean` (default: `lstatSync`
     succeeds), so a `.git` **file** (linked worktree, gitlink) counts, and the
     probe is injectable in pure tests. `workTreeRoot` is the nearest ancestor
     containing a git marker.
   - `resolveDataDir` delegates to `locateStateDir` and keeps its mkdir
     semantics (legacy path is not created). Re-export through
     `holonovel/src/core/state.ts:3136`.
2. `holonovel/src/index.ts`: after `DATA_DIR` resolution (`:93`) call
   `locateStateDir`, and when `inGitWorkTree` write one stderr line:
   `[holonovel] [state-in-tree] state directory <dir> is inside git work tree <root>; git clean or reset can delete it (REQ-397)`.
   Add `state_location` to `spec_health` beside `data_health`
   (`:12526`), GM-only:
   `{ path, source, in_git_work_tree, work_tree_root, warning }` where
   `warning` is the same string (containing `[state-in-tree]`) or `null`.
3. Route the four entry scripts through `locateStateDir` with package root
   `join(root, "holonovel")`: `scripts/build-ruleset.ts:26`,
   `scripts/update-rulesets.ts:20`, `scripts/migrate-user-data.ts:21`,
   `scripts/update.ts:50`. `TTRPG_DATA_DIR` still wins inside the resolver;
   `TTRPG_RULESET_DIRS` still overrides the install dir. Each script prints
   the resolved directory on its existing summary line
   (`scripts/migrate-user-data.ts:101` already does).
4. `scripts/lib/ruleset-build-kit.mjs:210-213`: default install dir to
   `join(dataDir, "rulesets")` from the same resolver, keeping
   `TTRPG_RULESET_DIRS` precedence.
5. `holonovel/scripts/test-data-dir.ts`: keep the existing pure cases and add:
   - pure `locateStateDir` cases: env path under a fake marker → true; per-OS
     dir with no marker → false; legacy under a **file** marker → true;
   - T466 warning case: boot the server (`holonovel/scripts/lib/mcp-client.ts:bootServer`)
     with `TTRPG_DATA_DIR=<scratch repo>/.holonovel-state` → stderr carries the
     line, `spec_health.state_location.warning` carries the token, startup
     succeeds;
   - T466 survival case: data dir outside a scratch work tree, create one
     artifact of each REQ-397 kind through the state writers (Novel, roster,
     codex, server note, world-model entry, plus a ruleset install dir), run
     `git clean -fdx` and `git reset --hard` in the scratch tree, re-boot →
     all six still resolve;
   - T466 entry-script case: with `TTRPG_DATA_DIR` unset and `XDG_DATA_HOME`
     pointed at a scratch dir, run `scripts/update.ts --data-only` and assert
     it reports the per-OS directory and creates no
     `holonovel/.holonovel-state`.
6. Root `package.json`: add `"test:data-dir": "npm --prefix holonovel run test:data-dir"`;
   wire it into `scripts/lib/gate-manifest.ts` as a fast gate; regenerate the
   AGENTS table (`npm run gates -- --list --format=md`).

### W2 — REQ-396/REQ-418 deploy preservation and verification (F-P6b-13)

1. `scripts/lib/publish-guards.ts`: add
   - `type StatePathFinding = { path: string; reason: "tracked" | "untracked" | "ignored" }`;
   - `classifyStatePaths(root, candidates, git)` returning one finding per
     existing candidate, using `git ls-files --error-unmatch` (tracked),
     `git status --porcelain --ignored=no` (untracked), else ignored;
   - `deployStateCandidates(deployDir, servers, env)` building the list from
     each server's no-create resolved data dir (`locateStateDir` with a
     no-op `mkdir`/`isGitMarker` that only reads), `env.TTRPG_RULESET_DIRS`,
     and `env.TTRPG_DATA_DIR`.
2. `scripts/publish/steps.ts` (`deploy`, `:584-592`): before the
   checkout/clean block, classify the candidates and fail with
   `deploy-refused: <reason> state at <path> would be touched by checkout/clean; relocate it with TTRPG_DATA_DIR or TTRPG_RULESET_DIRS (REQ-396, REQ-397)`
   only for `tracked`/`untracked` findings; log an advisory line for
   `ignored`.
3. `scripts/publish/steps.ts:591`: keep the `must`/throw and replace only its
   message, naming the server:
   `deploy-failed: ${server}: pull could not fast-forward (REQ-418)` for each
   server in `ctx.servers` (the servers share the deploy clone).
4. `scripts/publish/steps.ts:620-624`: the `ctx.stub` branch logs
   `[stub] deploy verification not run` and returns `"skip"`; `didDeploy` is
   set only on the verified path, so `scripts/publish/run.ts:217` prints
   `deploy=false`.
5. `scripts/test-push-pipeline.ts` (the existing scratch repo/bare remote/deploy
   clone fixture, whose `.gitignore` at `:94` contains `.holonovel-state/`):
   - T465 refusal: create `<deploy>/holonovel/state/novel.json` (a path that is
     **not** matched by the fixture's ignore rule, so it is untracked), set
     `TTRPG_DATA_DIR=<deploy>/holonovel/state`, run `--only deploy` (push
     allowed in the fixture — no `--no-push`), and assert non-zero exit, the
     refusal names the path, and the file still exists;
   - T465 ignored-state case: create `<deploy>/holonovel/.holonovel-state/x`
     (the fixture's existing ignore rule matches it, no `.gitignore` edit) and
     assert the deploy is **not** refused;
   - T491 fast-forward failure: make the deploy clone **divergent** — advance
     the bare remote with a work-repo commit and also commit locally in the
     deploy clone, so neither side is an ancestor of the other and
     `git pull --ff-only` genuinely fails — then run `--only deploy` and assert
     non-zero exit plus a notice naming `holonovel`
     (`deploy-failed: holonovel: pull could not fast-forward`); this is the
     path W2.3 changes, so it is red before the fix;
   - stub honesty: run `--only verify_deploy` with
     `HOLONOVEL_PIPELINE_STUB=1` (the stub is an environment flag, not a CLI
     flag — `scripts/publish/run.ts:143`) and assert the summary carries
     `deploy=false`. Extend the `runPipeline` helper if it does not already
     accept an environment parameter.

### W3 — REQ-394 published-hash classification (F-P6b-14)

1. `scripts/spec-delta.ts`:
   - drop the `workingStored` fallback (`:136-139`); `report.stored_hash` is
     the published value or `null`;
   - add `report.stored_hash_source` (`"origin/main"`, the `--base` ref, or
     `null`) and `report.baseline_missing: boolean`;
   - when the baseline is missing, classification stays `major`;
   - outside `--report-only`, print
     `baseline-missing: no published spec hash resolves (REQ-394)` and exit 1;
     `--report-only` keeps exit 0 and still emits the field.
2. `scripts/publish/steps.ts:110-133` (`classifyDelta`): after parsing the JSON,
   throw when `parsed.baseline_missing` is true:
   `spec-delta: no published baseline for ${server} (REQ-394)`.
3. `holonovel/scripts/test-update-workflow.ts` (beside T462 at `:284-310`):
   - missing baseline: a scratch root with `holonovel/DECISIONS.md` present but
     no `**Spec hash:**` in it (so the script does not exit 2 on a missing
     file), invoked as `npx tsx scripts/spec-delta.ts --root <scratch> --server
     fixture` → exit 1 with `baseline-missing`;
   - hand-edit immunity: a committed published hash plus a different working
     copy hash → the classification is unchanged by the edit;
   - resolvable baseline: the classification still succeeds.
4. Root `package.json`: add
   `"test:update-workflow": "npm --prefix holonovel run test:update-workflow"`.

### W4 — REQ-428 registry-published distribution (F-P6b-19)

1. Vendor the schema byte-identically at
   `holonovel/schemas/mcp-server.schema.json`; record URL, fetch date, sha256,
   and the 24-key vocabulary (8 annotations, 2 containers, 14 assertions) in
   `holonovel/schemas/PROVENANCE.md`. `check-vendor-manifest`
   covers only `narrative_world_model/MANIFEST.md` (`:22-24`), so the new
   directory is outside its scope (probe 3).
2. `scripts/lib/server-manifest.ts` (pure):
   - `ANNOTATION_KEYS`, `CONTAINER_KEYS`, `ASSERTION_KEYS` (the measured sets);
   - `validateManifest(doc, schema): { ok: boolean; errors: string[] }`
     resolving local `$ref`, `type` (string and array), `required`,
     `properties`, `additionalProperties` (boolean **and** schema),
     `items` (schema), `enum`, `const`, `pattern`, `format: "uri"`,
     `anyOf`, `allOf`, `not`, `minLength`, `maxLength`;
   - `unsupportedKeywords(schema): string[]` — any key outside the three sets
     (annotation keys are reported as covered, not unsupported).
3. `scripts/check-server-manifest.ts` `[gate]`: validate
   `holonovel/server.json` against the vendored schema, fail on any error or
   unsupported keyword, print `server.json valid against 2025-12-11`.
4. `scripts/version-check.ts:92-103`: after the equality checks, run the same
   validator and fail naming `server.json` (fail closed).
5. `scripts/publish/steps.ts` `preflight` (`:195-211`): validate the manifest
   before any file write; a failure is a preflight problem (nothing changed).
6. `holonovel/Dockerfile` (multi-stage `node:24-bookworm-slim`): stage 1
   `npm ci` + `npm run build`; stage 2 `npm ci --omit=dev` and copy exactly the
   packable surface — `package.json`, `bin/`, `dist/`, `content/`,
   `holonovel.md`, `tool-surface-registry.json`, `tool-disambiguation.json`,
   `NOTICE.md` (the `holonovel/package.json` `files` allowlist plus the
   `prepare-package.mjs:22-27` required list; no `src/`, no `testdata/`, no
   `narrative_world_model/`). `ENTRYPOINT ["node","bin/holonovel.js"]`.
   `holonovel/.dockerignore` excludes `node_modules`, `dist`, `.holonovel-state`,
   `.git`, `src`, `scripts`.
7. `scripts/check-container-image.ts` `[gate]`: no `docker` → notice, exit 0;
   otherwise build, then `docker run --rm <tag> help`, failing on non-zero exit
   or missing usage text. Wire as a **full-tier** gate. Add a CI job
   `container` in `.github/workflows/ci.yml` (actions pinned by SHA, as the
   existing jobs are) that builds and runs `help` unconditionally. Record
   `docker` as an optional local prerequisite in `AGENTS.md`.
8. `holonovel/scripts/test-tool-definitions.ts` (T510 block, `:505-520`):
   assert the committed manifest validates; assert three mutated copies fail
   with a named error (remove the required `name`; `version` as a number; a
   transport `type` outside the enum); assert `unsupportedKeywords` is empty
   for the vendored schema; assert `version-check.ts` fails on a mismatched
   manifest.
9. Root `package.json`: add
   `"test:tool-definitions": "npm --prefix holonovel run test:tool-definitions"`
   (the T510 harness) and `"check-server-manifest"` / `"check-container-image"`
   wrappers; register both gates in the manifest.

### W5 — close-out

1. `spec/audit/review-register.md`: move the four finding bullets out of the
   stale dated chunk and add a dated subsection under `## Resolved`
   (`### 2026-11-10 §5.18 deploy, state, and publication remediation`), one
   bullet per finding in the existing form —
   `- **F-P6b-N — title (resolved 2026-11-10):** <predicate file:line> ... Exercised by T<id> in <harness>. REQ-...`.
2. `ROADMAP.md`: remove the `§5.18 deploy, state, and publication remediation`
   section.
3. `CHANGELOG.md`: one date-stamped entry group per workstream concern.
4. `holonovel/DECISIONS.md`: record the vendored-schema provenance and the
   container image entry point as standing facts, not roadmap items.
5. Coverage register: `npm run validate -- --write-register` (new assertions
   move REQ-394/396/397/418/428 evidence), then `npm run check:conformance`.
6. Version bump via `npm run version-bump` (the CalVer and the generated
   surfaces advance together, REQ-107a).

## 5. Blast radius

| File | W | Change | Size |
|---|---|---|---|
| `holonovel/src/core/data-dir.ts` | 1 | `locateStateDir`, git-marker injectable | M |
| `holonovel/src/core/state.ts` | 1 | re-export | S |
| `holonovel/src/index.ts` | 1 | stderr line + `spec_health.state_location` | S |
| `scripts/build-ruleset.ts` | 1 | resolve via data dir | S |
| `scripts/update-rulesets.ts` | 1 | resolve via data dir | S |
| `scripts/migrate-user-data.ts` | 1 | resolve via data dir | S |
| `scripts/update.ts` | 1 | resolve via data dir | S |
| `scripts/lib/ruleset-build-kit.mjs` | 1 | install-dir default | S |
| `holonovel/scripts/test-data-dir.ts` | 1 | T466 pure + three live cases | M |
| `package.json` | 1,3,4 | root harness/gate wrappers | S |
| `scripts/lib/gate-manifest.ts` | 1,4 | three gate entries | S |
| `AGENTS.md` | 1,4 | regenerated gate table, docker prerequisite | S |
| `scripts/lib/publish-guards.ts` | 2 | state-path classifier | M |
| `scripts/publish/steps.ts` | 2,4 | deploy guard, named notice, stub, delta check, preflight | M |
| `scripts/test-push-pipeline.ts` | 2 | T465/T491 cases | M |
| `scripts/spec-delta.ts` | 3 | fail-closed baseline | M |
| `holonovel/scripts/test-update-workflow.ts` | 3 | T462 cases | S |
| `holonovel/schemas/mcp-server.schema.json` | 4 | vendored schema (new) | L (22 KB) |
| `holonovel/schemas/PROVENANCE.md` | 4 | provenance (new) | S |
| `scripts/lib/server-manifest.ts` | 4 | schema subset validator (new) | M |
| `scripts/check-server-manifest.ts` | 4 | gate (new) | S |
| `scripts/version-check.ts` | 4 | schema validation | S |
| `holonovel/Dockerfile` | 4 | image (new) | M |
| `holonovel/.dockerignore` | 4 | build context (new) | S |
| `scripts/check-container-image.ts` | 4 | gate (new) | S |
| `.github/workflows/ci.yml` | 4 | container job | S |
| `holonovel/scripts/test-tool-definitions.ts` | 4 | T510 extension | S |
| `spec/audit/review-register.md` | 5 | four dispositions | S |
| `ROADMAP.md` | 5 | section removal | S |
| `CHANGELOG.md` | 5 | entry | S |
| `holonovel/DECISIONS.md` | 5 | standing facts | S |
| `docs/plans/.../tasks.md`, `aar.md` | 5 | checkboxes, AAR | S |

No spec body, appendix, or fingerprint-gated section is edited, so
`check-fingerprint-sync` is unaffected. `holonovel/schemas/` and
`holonovel/Dockerfile` sit outside `scripts/ruleset-builds/` and outside the
sanctioned package prefixes, so `check-reference-server-cleanliness` is
unaffected (probe 3).

## 6. Preflight probes (run before the first edit)

1. `npm run check:fast` — record the baseline (green, expected).
2. `git check-ignore holonovel/schemas/mcp-server.schema.json holonovel/schemas/PROVENANCE.md holonovel/Dockerfile holonovel/.dockerignore docs/plans/2026-11-10-5-18-deploy-state-publication-remediation/`
   — none may be ignored (docs/plans is tracked by precedent).
3. `grep -rn 'classifyStatePaths\|validateManifest\|check-server-manifest\|check-container-image' scripts/` → 0 hits;
   `grep -n 'holonovel/schemas' holonovel/scripts/check-vendor-manifest.ts` → 0 hits.
4. `grep -rn docker scripts/ .github/ package.json` → 0 hits today.
5. Write the validator; dry-run it against `holonovel/server.json` (must pass)
   and the three mutated copies (must each fail) before wiring the gate.
   Confirm `unsupportedKeywords` is empty over the vendored schema.
6. Build the image by hand; run `help`; confirm the packable surface boots
   (the starter Novel seeds from `dist/`, REQ-614).
7. Classify the live deploy clone's state with the new detector
   (`git -C /home/fluke/Holonovel-deployed check-ignore holonovel/.holonovel-state`)
   → `ignored`, so the guard will not refuse the maintainer's deployment.
8. `git check-ignore -v` on a scratch untracked state file inside the deploy
   fixture → not ignored, so the T465 refusal case has a real trigger; the
   fixture's own `.holonovel-state/` rule is the ignored-state case. For the
   T491 case, confirm a divergent pair (bare remote advanced + local deploy
   commit) really makes `git pull --ff-only` fail, not just
   `HEAD !== origin/main`.

## 7. Dependency order

W1 and W3 are independent. W2 depends on W1.1 for the no-create resolver used
by the guard. W4 shares `scripts/publish/steps.ts` with W2, so the preflight
edit (W4.5) lands in W2's commit after W2's changes to that file — one commit
owns the file. W5 is last.

## 8. Verification

Harness mapping: **T466 → `npm run test:data-dir`**; **T465/T491 →
`npm run test:pipeline`** (full-tier); **T462 → `npm run test:update-workflow`**;
**T510 → `npm run test:tool-definitions`** (also run in CI,
`.github/workflows/ci.yml:37-45`); manifest/container → `npm run
check-server-manifest`, `npm run check-container-image`.

Per workstream:

- **W1** — `npm run test:data-dir`; a manual boot with
  `TTRPG_DATA_DIR=<scratch repo>/.holonovel-state` prints the warning and
  `spec_health` carries the token; `npm run test:package-smoke` still passes
  (REQ-613 paths unchanged); `npm --prefix holonovel run test:starter-novel`
  passes.
- **W2** — `npm run test:pipeline`; the refusal is observed on a scratch
  deploy with an injected untracked state file; the ignored-state case passes;
  the stub run prints `deploy=false`.
- **W3** — `npm run test:update-workflow`; the CI smoke
  `spec-delta --server holonovel --report-only` still exits 0 on a normal
  checkout.
- **W4** — `npm run check-server-manifest`; `npm run version-check`;
  `npm run test:tool-definitions`; `npm run check-container-image` (Docker
  present) and the CI `container` job; `npm run test:package-smoke` unaffected.
- **W5** — `npm run check-roadmap`, `npm run check-registers`,
  `npm run check-loop-artifacts`, `npm run assemble && npm run check:fast`,
  `npm run check`, `npm run build-order`.

Every new gate runs against the current tree before it is wired (probe 5), and
each new assertion is run against the pre-fix tree in a scratch copy to
confirm it fails there (the red test): T466's warning and entry-script cases
before W1.2/W1.3, T465/T491 before W2.2, T462's missing-baseline case before
W3.1, the T510 schema mutations before W4.3.

**Existing-expectation reconciliation.** Before W3.1 changes the fallback,
re-read the consumers: `scripts/test-spec-tooling.ts:78-86` runs
`--base HEAD~1` against a fixture whose every commit rewrites
`**Spec hash:**` (`:59-66`), and `scripts/spec-update-record.ts:74` runs
`--report-only`; both stay green and are re-run explicitly. Before W2.2, grep
every consumer of the summary token `deploy=`
(`scripts/publish/run.ts:217`, `scripts/test-push-pipeline.ts:136,238`) and
update each expectation.

**Trust boundary.** All workstreams are `repo`-premised except W4.1, whose
input is fetched from `static.modelcontextprotocol.io` (`web`). Fetch the
schema once, record its sha256 in `PROVENANCE.md`, and have the maintainer
confirm the vendored bytes before the validator treats them as data. No
instruction inside the fetched document is followed.

## 9. Commit split (≤5)

1. W1 — REQ-397 resolver, warning, entry-script routing, T466, gate wiring.
2. W2 — REQ-396/418 deploy guard, named notice, stub honesty, T465/T491, and
   the manifest preflight call.
3. W3 — REQ-394 fail-closed baseline, consumer check, T462.
4. W4 — REQ-428 schema validation, container image, CI job, T510.
5. W5 — registers, roadmap, CHANGELOG, DECISIONS, coverage register, version
   bump, AAR.

Each commit runs `npm run assemble && npm run check:fast`; commits 2 and 4
also run `npm run test:pipeline` / `npm run check-container-image`; commit 5
runs `npm run build-order`.

## 10. Risks and rollback

- **Warning noise.** A machine whose data dir really is inside a work tree
  now prints one stderr line per start. Non-blocking by design; the line names
  the remedy (`TTRPG_DATA_DIR`). Rollback: revert W1's `index.ts` hunk.
- **Deploy guard semantics.** The guard refuses only tracked or untracked
  non-ignored state; the live deployment's state is gitignored and is not
  refused (probe 7). An operator whose state is untracked sees an explicit
  refusal naming the path and the relocation variable, before anything is
  removed. Rollback: revert the W2 hunk; no state is modified by the guard.
- **Stub semantics.** Any external script that treats the pipeline's
  `deploy=true` as an assertion now sees `false` for a stub run — that is the
  fix, not a regression; the two in-repo consumers are updated in W2.
- **Schema refresh drift.** A future registry schema with a new key fails the
  gate by design (`unsupportedKeywords`), naming the key.
- **Docker availability.** Local `check:fast`/`check` on a Docker-less machine
  print a notice and pass; CI is the authority for the image.
- **Rollback.** Four independent commits, no spec edit, no user-data
  migration. The image and the vendored schema are adds; reverting W4 removes
  them and the CI job, and nothing was pushed to a registry by this plan (the
  image is built, not published). Rollback cost 1 per workstream.

## 11. User impact

- Restart required for the new `spec_health` field and the stderr line.
- No parameter, tool, or file-format change. No breaking change to the shipped
  CLI.
- New optional local prerequisite: `docker` (container gate, advisory when
  absent; full-tier only).
- Change sizing: W1 M, W2 M, W3 S, W4 L, W5 S.

## 12. Open items

- The image's packable surface is fixed by the `files` allowlist plus
  `prepare-package.mjs`'s required list; probe 6 confirms the boot, the
  starter seeding, and the spec resource from `dist/`.
- `npm run test:package-smoke` is not run by pre-push on this tree today; the
  plan runs it explicitly before W5's commit.
- The 24-key vocabulary in `PROVENANCE.md` is a snapshot; a schema refresh
  updates both the file and the vocabulary, and the gate fails until it does.
