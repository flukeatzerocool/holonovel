# Tasks — §5.18 deploy, state, and publication remediation

Plan: `plan.md` (deep depth; stamped fresh). Done bar lives there; this file is
the execution checklist. Status: executed, verified.

## W0 — preflight probes

- [x] `npm run check:fast` — baseline green (38/38).
- [x] `git check-ignore` on the new schema/Dockerfile/plan paths — none ignored.
- [x] `grep` for `classifyStatePaths`/`validateManifest`/`check-server-manifest`/`check-container-image`
      → 0 hits; `check-vendor-manifest` does not name `holonovel/schemas`.
- [x] `grep docker scripts/ .github/ package.json` → 0 hits before the change.
- [x] Validator dry-run: committed manifest valid, three mutations refused,
      `unsupportedKeywords` empty.
- [ ] Build the image by hand — **not possible on this host**: the docker daemon
      is unreachable (`permission denied` on `/var/run/docker.sock`). The gate
      treats an unreachable daemon as a notice; CI's `container` job builds and
      starts it unconditionally.
- [x] Live deploy clone's state is gitignored (`check-ignore` → `.gitignore:7`),
      so the guard does not refuse it; a scratch untracked state file is not.
- [x] `scripts/update.ts --data-only` runs standalone for the T466 case.

## W1 — REQ-397 untracked state location

- [x] `data-dir.ts`: `StateDirLocation`, `locateStateDir`, `isGitMarker`
      injectable (`.git` file or dir), no creation.
- [x] `resolveDataDir` delegates; mkdir semantics unchanged.
- [x] Re-export from `core/state.ts`.
- [x] `index.ts`: stderr `[state-in-tree]` line; `spec_health.state_location`.
- [x] Route the four entry scripts through `locateStateDir`.
- [x] `ruleset-build-kit.mjs`: install-dir default from the resolved data dir.
- [x] `test-data-dir.ts`: pure cases, T466 warning, six-surface survival,
      entry-point resolution + no-hardcoded-fallback guard.
- [x] Root `test:data-dir` wrapper; gate manifest; AGENTS table.
- [x] Red test: warning and entry-script cases fail on the pre-fix tree.

## W2 — REQ-396/REQ-418 deploy preservation and verification

- [x] `publish-guards.ts`: `classifyStatePaths`, `deployStateCandidates`
      (tracked / untracked / ignored; no writes).
- [x] `steps.ts` deploy: refuse `tracked`/`untracked` before checkout/clean;
      advisory line for `ignored`; named fast-forward failure per server.
- [x] `steps.ts` verify_deploy: stub returns `skip`, `didDeploy` stays false.
- [x] `test-push-pipeline.ts`: T465 untracked refusal, T465 ignored-state pass,
      T491 divergent-clone failure, stub honesty (`deploy=false`).
- [x] `steps.ts` preflight: manifest validation (W4.5).
- [x] Red test: T465/T491 cases fail on the pre-fix tree.

## W3 — REQ-394 published-hash classification

- [x] `spec-delta.ts`: working-copy fallback removed; `stored_hash_source`,
      `baseline_missing`, conservative `major`; exit 1 outside `--report-only`.
- [x] `steps.ts` `classifyDelta`: throws on `baseline_missing`.
- [x] `test-update-workflow.ts`: T462 missing-baseline (working-copy hash
      ignored), hand-edit immunity, resolvable baseline.
- [x] Root `test:update-workflow` wrapper.
- [x] Red test: the missing-baseline case fails on the pre-fix tree.

## W4 — REQ-428 registry-published distribution

- [x] Vendor `holonovel/schemas/mcp-server.schema.json` byte-identically +
      `PROVENANCE.md` (24 keys: 8 annotations, 2 containers, 14 assertions).
- [x] `scripts/lib/server-manifest.ts`: validator + `unsupportedKeywords`.
- [x] `scripts/check-server-manifest.ts` gate (`--root` for fixtures).
- [x] `version-check.ts`: schema validation, fail closed naming `server.json`.
- [x] Preflight: manifest validation before any write; hermetic fixture carries
      the manifest and schema.
- [x] `holonovel/Dockerfile` + `.dockerignore` (packable surface only).
- [x] `scripts/check-container-image.ts` **full-tier** gate; CI `container` job
      with SHA-pinned actions.
- [x] `test-tool-definitions.ts`: T510 mutations (missing `name`, numeric
      `version`, bad transport `type`), vocabulary coverage, gate refusal.
- [x] Root wrappers: `test:tool-definitions`, `check-server-manifest`,
      `check-container-image`.
- [x] Red test: mutated-manifest cases fail on the pre-fix tree.

## W5 — close-out

- [x] Review register: four findings moved to a `## Resolved` dated subsection
      with `file:line` + exercised assertion; F-P6b-21 narrowed.
- [x] `ROADMAP.md`: §5.18 section removed; citation-repair bullet narrowed.
- [x] `CHANGELOG.md` entry.
- [x] `holonovel/DECISIONS.md`: schema, container, in-tree state, delta baseline.
- [x] `npm run validate -- --write-register`; `check:conformance`.
- [x] `npm run version-bump`; `npm run assemble && npm run check:fast`;
      `npm run check`; `npm run test:pipeline`; `npm run test:package-smoke`;
      `npm run build-order`.
- [x] AAR (`LOOP PAUSED`).
