# Tasks — §5.17/§5.18 package build and update remediation

Plan: `plan.md` (stamped fresh, standard depth). Done bar lives there; this
file is the execution checklist.

## W0 — preflight probes

- [x] `grep -rn "testdata/rulesets/fixture" scripts/ holonovel/scripts/` — no
      existing gate already compares the committed package.
- [x] Boot the host with the fixture installed in a temp `TTRPG_DATA_DIR`;
      confirm it loads with an empty `tools.json`.
- [x] `git check-ignore scripts/ruleset-builds/fixture/build-package.mjs`;
      verify the negated rule after editing.

## W1 — covered package and sanction

- [x] `scripts/ruleset-builds/fixture/build-package.mjs` — `[build tool]`,
      shebang, exit codes 0/1/2, `--baseline/--out/--dry-run/--json/
      --no-backup/--check/--help`; default baseline
      `holonovel/testdata/rulesets/fixture`; pinned `built_at`.
- [x] `emitFromBaseline` gains `defaultBaselineDir` and `--json`
      (`content_hash`).
- [x] `.gitignore` → `scripts/ruleset-builds/*` + `!scripts/ruleset-builds/fixture/`.
- [x] `check-reference-server-cleanliness.ts` → `SANCTIONED_BUILD_PREFIXES`
      (fixture only).
- [x] `scripts/check-fixture-emitter.ts` gate wrapper; register in
      `scripts/lib/gate-manifest.ts`; regenerate the AGENTS gate table.
- [x] `package.json` → `build:covered-package`, `check-fixture-emitter`.
- [x] Re-emit the fixture manifest; run `--check` (six files) dry before wiring.
- [x] `scripts/version-bump.ts` re-emits the covered package.
- [x] DECISIONS.md: resolution + deferred REQ-395a new-package decision.

## W2 — `build-ruleset` invokes the emitter

- [x] `resolveEmitter` repo args → `["--out", "{dir}"]` (no install-dir
      baseline).
- [x] `build-ruleset` resolves, runs `runRebuildWithGates`, propagates the exit
      code; per-slug `emitted` / `recorded, no emitter` / `failed`; record
      `emitter_args` as `["--out","{dir}"]`.
- [x] Verify from a clean clone with no install directory.

## W3 — staged rebuild and update gates

- [x] `runPackageGates` adds the REQ-560 replay.
- [x] `test-ruleset-nonovel.ts --package <dir>` (default `fixture558`).
- [x] `runRebuildWithGates`: `--out <slug>.staging-<pid>` → three gates → back
      up → swap; failure removes staging, install and registry untouched; a
      non-staging emitter defers.
- [x] `update.ts` routes every rebuild through it; base-drift states:
      `current` / `base changed` / `base source unavailable` /
      `base emitter cannot report a hash`.

## W4 — supplement intake and provenance

- [x] Parse `slug+=path`; reject a supplement with no installed base.
- [x] Registry writers (`sources`, `base_content_hash`, `supplements`); base
      snapshot as rebuild input only.
- [x] `mergeSupplementParts(baseDir, supplementDirs) -> tempDir`
      (replace-by-key; never append).
- [x] Overlay: merge → emitter `--baseline <merged> --out <install>/<slug>`
      via `runRebuildWithGates`; `finally` cleanup of the merge dir.
- [x] Markdown-only supplement: record recipe + hashes, print Build invocation.
- [x] Append base/supplement/result hashes to `<state>/build-provenance.md`.

## W5 — `update-rulesets` reporter

- [x] Usage line + install directory.
- [x] Base-drift report with the same four states; unchanged base → no report.

## W6 — assertions and registers

- [x] T463, T650, T657 in `test-fingerprints.ts`; T499 extended there.
- [x] T689 extended in `test-update-workflow.ts`.
- [x] T656 in `test-ruleset-gates.ts` (six files + synthetic defective copy).
- [x] `npm run validate -- --write-register`.
- [x] F-P6b-7 / F-P6b-15 → `Resolved` with `file:line` evidence.

## W7 — spec, runbooks, close

- [x] `spec/appendices-runbooks.md` V.1/V.7.
- [x] Remove the roadmap section (same edit as the register disposition).
- [x] CHANGELOG; `assemble` + `check:fast`.
- [x] `build-order`; AAR ends `LOOP PAUSED` or `LOOP OPEN`.
