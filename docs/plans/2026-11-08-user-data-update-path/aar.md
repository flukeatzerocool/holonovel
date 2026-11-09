# AAR — self-service update path for packaged installs

**Date:** 2026-11-08 · **Plan:** `plan.md` · **Tasks:** `tasks.md`
**Status:** complete · **Terminal token:** `LOOP PAUSED`

## What was planned vs. what happened

| Planned | Outcome |
|---|---|
| C1 shipped `holonovel update` | Done: `src/cli/update.ts`, launcher dispatch, apply-with-backup, `--dry-run`, `--json` |
| C2 startup reconciliation | Done: `reconcileUserData` runs before hydration; `TTRPG_AUTO_MIGRATE=off` honored; read-only failures defer |
| C3 actionable health | Done: `stale_detail`, `stale_count`, top-level remedy, flag cleared on save, one stderr line |
| C4 format-only package re-emit | Done: `upgradeInstalledPackage` re-stamps the manifest after tool-schema and content-hash checks, with a backup |
| C5 packed-artifact gate | Done: failed first (`Unexpected end of JSON input`), then passed (11/11) |
| C6 harnesses | Done: T773–T775 added; T501/T503 read the advisory before a saving activation |
| C7 docs | Done, with a budget-driven split: README carries a pointer; detail lives on the wiki |
| C8 version/registers/AAR | Done via `build-order` + coverage register |

## Findings and dispositions

| ID | Disposition |
|---|---|
| F1 (no shipped command) | Fixed — REQ-650, `bin/holonovel.js update`, packed gate T776 |
| F2 (dormant data never re-stamps) | Fixed — REQ-651 startup reconciliation |
| F3 (GM-only, reason-only signal) | Fixed — REQ-652 `stale_detail` + remedy + count; save clears |
| F4 (stale package has no rebuild path) | Fixed — REQ-579a format-only re-emit, gated and backed up |
| F5 (no gate exercises the shipped command) | Fixed — T776 in `smoke-package.ts` (fail-first proven) |
| F6 (tests spawn repo scripts) | Fixed — T773 drives the runtime command |
| F7 (builder-only docs) | Fixed — README pointer, wiki packaged-user section, runbooks V.4/V.7/V.8 |
| F8 (`npx -y` arrives unannounced) | Mitigated — startup stderr line + pinning guidance in the wiki |
| F9 (dry-run-only default) | Fixed — shipped command applies by default; operator entry point keeps dry-run |
| F10 (`starter-seeded.json` version unread) | Record-and-close — no demonstrated failure; not worth a schema field |

## Deviations (plan amendments)

1. **REQ-614 `_Check:_` edit dropped.** REQ-614 lives inside §5.9, a
   fingerprinted section; adding T776 advanced `DATA_FORMAT` and would have
   forced a global re-stamp for a test-row edit. T776 is cited from REQ-650 and
   Appendix T instead. Recorded in `plan.md` under Delta amendments.
2. **T501/T503 reordered.** The new save-time flag clearing (REQ-652) means an
   activation that writes the Novel clears its advisory. The tests now read the
   advisory before resuming; this is the intended behavior, not a regression.
3. **README detail moved to the wiki.** `validate-readme` enforces a 1,500-word
   budget; the README keeps a two-line pointer and the operational detail
   (backups, rollback, `TTRPG_AUTO_MIGRATE`, pinning) lives on the wiki page.

## Evidence

| Check | Command | Result |
|---|---|---|
| Baseline | `npm run check:fast` | PASS (37 gates) |
| Fail-first gate | `npm run test:package-smoke` | FAIL — `T776 … Unexpected end of JSON input` |
| Typecheck | `npm run typecheck` | exit 0 |
| Fingerprint harness | `npx tsx holonovel/scripts/test-fingerprints.ts` | 12 passed, 0 failed |
| Packed artifact | `npm run test:package-smoke` | 11 passed, 0 failed |
| Spec validation | `npx tsx scripts/validate.ts --sdd-strict` | 0 errors, 276 warnings (pre-existing quality warnings) |
| README | `npx tsx scripts/validate-readme.ts` | PASS |
| Build order | `npm run build-order` | PASS (see final run) |

Runtime spot checks: the CLI re-stamped a stale novel and roster with backups;
a stale `dnd2024` package was re-emitted to `cf905514…` with a
`rulesets-backup-*` directory; startup with `TTRPG_AUTO_MIGRATE=on` re-stamped a
stale novel, and `off` kept it stale and printed the notice.

## What went right

- The formatted-REQ measurement before editing avoided two spec-shape errors:
  REQ-395c/424 are exactly at the 800-char limit, so the contract went into new
  REQs.
- The fail-first gate produced a real recorded failure of the pre-change state,
  which is the evidence F1 needed.
- Reusing `migrateNovelData` and `computeContentHash` kept the runtime path
  consistent with the build tooling without shipping build-only files.

## What went wrong

- The first plan draft assumed §5.18 was the only touched section; REQ-614's
  location in §5.9 was discovered only when the fingerprint diverged. The
  fingerprint check now belongs in the pre-execution checks.
- The README budget was not accounted for at draft time; the docs change was
  reshaped mid-execution.
- Two harness expectations (T501/T503) encoded the old "flag survives a save"
  behavior, which the change intentionally fixes.

## Open items

None. F10 is record-and-close. No P0/P1 remains outside the roadmap.

`LOOP PAUSED`
