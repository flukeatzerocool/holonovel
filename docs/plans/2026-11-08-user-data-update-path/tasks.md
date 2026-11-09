# Tasks — user data and package update path

Dependency-ordered. Each task group ends with a verification command; do not
start the next group on a failure introduced by the current one.

## T0. Pre-execution checks

- [ ] Run the sibling-REQ grep (plan §Pre-execution checks).
- [ ] Confirm `holonovel/tsconfig.build.json` compiles the new `src/cli/` path.
- [ ] Confirm `docs/plans/2026-11-08-user-data-update-path/plan.md` is trackable.
- [ ] Record the baseline: `check:fast` PASS, 37 gates (already captured).

## T1. Error-gate dry run (before any feature code)

- [ ] Extend `holonovel/scripts/smoke-package.ts` with a packed-artifact
      `update --dry-run` assertion (T776).
- [ ] Run it against the current tree; confirm it FAILS naming the missing
      subcommand. Record the failure text in `aar.md` as the F1 proof.
- [ ] Do not proceed until the failing assertion is captured.

## T2. Runtime command skeleton (C1)

- [ ] Add `holonovel/src/cli/update.ts` exporting `main(argv): number`.
- [ ] Dispatch in `holonovel/bin/holonovel.js`: known subcommand → import
      `../dist/cli/update.js`; otherwise current behavior unchanged.
- [ ] Implement `--dry-run`, `--json`, `--data-only`, `--packages-only`,
      `--help`; exit codes 0/1/2 per repo convention.
- [ ] Data tier: enumerate novels, roster, codex, server-notes; report each.
- [ ] `--dry-run` writes nothing; apply writes atomically after a
      `.bak-<epoch>` backup.
- [ ] Verify: `node bin/holonovel.js update --dry-run` against a temp
      `TTRPG_DATA_DIR` (seed one prior-fingerprint artifact).
- [ ] `npm run typecheck`.

## T3. Format-only package re-emit (C4)

- [ ] Implement the package tier in `src/cli/update.ts`: read the six files,
      derive format-level fields, recompute the content hash, run the same
      assertions as `check-ruleset-package`/`check-ruleset-model`, back up,
      replace.
- [ ] On a gate defect: leave the package untouched, report `deferred` with the
      defect.
- [ ] Verify with a fixture package stamped at a prior `package_format`.
- [ ] Add T672 sub-cases for the re-emit and refusal paths.

## T4. Startup reconciliation (C2)

- [ ] Add a `reconcileStaleAtStartup()` helper in `state.ts` reusing the same
      re-stamp routine; call it after hydration in `index.ts`.
- [ ] Respect `TTRPG_AUTO_MIGRATE=off`; catch `EROFS`/`EACCES` and keep the
      advisory flag.
- [ ] Clear `staleData` entries on success.
- [ ] Add the §7.6 row for `TTRPG_AUTO_MIGRATE` (class `Storage.`).
- [ ] Verify: fixture with prior fingerprints is current after startup, one
      backup per artifact; read-only dir starts cleanly.
- [ ] Add T774.

## T5. Actionable health and notice (C3)

- [ ] Extend `data_health.stale` entries with `stored`, `current`, `reason`,
      `remedy`.
- [ ] Clear the flag after any successful save.
- [ ] Emit one stderr line at startup with counts and the remedy.
- [ ] Verify: T775; `npm run check-tool-definitions-sync`.

## T6. Spec text (C1–C4)

- [ ] Add REQ-650/651/652/579a to `spec/02-requirements.md` §5.18.
- [ ] Update the §5 map row (`spec/02-requirements.md:26`) with
      `579a, 650–652`.
- [ ] Append the one §6.7 sentence naming the runtime command.
- [ ] Add T773–T776 rows to `spec/appendices-reference.md`.
- [ ] Run `npm run assemble && npm run check:fast`.
- [ ] `npm run validate -- --write-register`.

## T7. Harnesses (C5, C6)

- [ ] Finish the T776 packed-artifact assertion; confirm it now PASSES.
- [ ] Add the pure `checkManifest` assertion that the launcher path is inside
      `files`; extend `scripts/test-package-manifest.ts`.
- [ ] Route T501/T502 through `bin/holonovel.js update` (dist path).
- [ ] Extend T649 for the deferred/re-emit outcomes.
- [ ] Each new case name carries its T-ID prefix (e.g.
      `T773/REQ-650: ...`), matching the existing harness convention.
- [ ] Verify: `npx tsx holonovel/scripts/test-fingerprints.ts`,
      `npx tsx holonovel/scripts/test-update-workflow.ts`,
      `npx tsx holonovel/scripts/test-package-manifest.ts`,
      `npm run test:package-smoke`.

## T8. Documentation (C7)

- [ ] README: "Updating Holonovel" — command, automatic behavior, backup
      location, rollback, version pinning.
- [ ] Wiki: split builder vs user guidance in `Updating-a-Server.md`; link from
      `Getting-Started.md`.
- [ ] Appendix V.4/V.8 name both interfaces.

## T9. Close the increment (C8)

- [ ] CHANGELOG entry with today's date.
- [ ] `npm run build-order` (version, AGENTS.md, DECISIONS.md, `index.ts`,
      lockfile, `server.json`).
- [ ] `npm run check` and `npm run test:package-smoke`.
- [ ] Write `aar.md` with terminal dispositions for F1–F10 and a LOOP token.
- [ ] `npm run session:close`.

## Slip rule

If a change cannot land this session, add a dated `ROADMAP.md` section with a
`**Trigger:**` and a matching `Scheduled-roadmap` row in
`spec/audit/review-register.md` in the same increment. No finding may be left
with a prose recommendation and no owner.
