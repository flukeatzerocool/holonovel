# AAR — fingerprinted-section tool-token re-point

**Date:** 2026-11-11 · **Plan:** `plan.md` (amendments A1–A4) ·
**Roadmap item retired:** *Fingerprinted-section tool-token re-point (P2)* ·
**Register:** F-P6a-21 → `Resolved`

## What happened

1. **Red test (T1).** Emptied `TOKEN_ALLOW` in `scripts/tool-citation-check.ts`
   first. `npm run tool-citation-check` failed with exactly three entries —
   `REQ-221b`, `REQ-330a`, `REQ-385a`, each "cites the unregistered tool token
   `command` (registered: run_command)". The predicted set matched exactly, so
   the predicate (not the allowlist) is what had been holding the three bodies
   green.
2. **Spec edits (T2–T5).** Re-pointed the three bodies and deleted the §4
   deferral sentence. `npm run assemble` produced exactly the four intended
   hunks in `holonovel.md`, plus the assemble-owned content-hash line in
   `spec/build-phase-map.md` (A1).
3. **Green (T7).** `npm run tool-citation-check` → PASS; `--json` reports
   `token_drift: []`, `violations: 0`.
4. **Shape (T2–T4).** `npm run validate:fast` → 0 errors, 3 warnings, all three
   pre-existing and unrelated (T261/T449/T776 "cited nowhere else in Section
   7" — §7 test-catalogue rows, untouched here).
5. **Fingerprints (T10).** First `npm run build-order` regenerated both
   constants (`package_format a16b1e40…`, `data_format 9c07813a…`) and failed
   the check step on `test:ruleset-gates`/T656 — the fixture emitter inside the
   harness suite saw the stale `manifest.json` (A2).
6. **Re-emit (T11).** `npm run build:covered-package` turned out to target the
   install directory, not the committed baseline (A3); the baseline was
   re-emitted with the emitter's `--out` invocation, and the starter Novel with
   `build:starter-novel`. `check-fixture-emitter`, `check-starter-freshness`,
   `check-fingerprint-sync` → PASS. Diffs are confined to the fingerprint
   fields (plus the starter's `spec_version`).
7. **Second build order (T12).** Green end to end: full `npm run check`
   (0 errors; warnings pre-existing), propagate, typecheck, version verify.
8. **Registers (T13).** Roadmap section removed; F-P6a-21 moved to
   `## Resolved` with the new `file:line` predicates; AAR finalised.
   `check-roadmap`, `check-registers:strict`, `check-loop-artifacts` → PASS.
9. **Final gate (T14).** `npm run assemble && npm run check:fast` → exit 0,
   `check:fast: PASS` (40 passed, 0 failed).

## Findings and dispositions

- **A1 — `spec/build-phase-map.md` moves on every assemble** (content-hash
  comment, REQ-278). Resolved: listed in the plan's blast radius; no action.
- **A2 — the stale-artifact reporter is `test:ruleset-gates`/T656, not a
  standalone freshness gate.** Resolved in the plan text; the diagnosis (both
  artifacts stale after a constants bump) was right, the predicted reporter was
  not.
- **A3 — `npm run build:covered-package` does not refresh the committed
  baseline.** It emits to `.holonovel-state/rulesets/fixture`. Resolved:
  correct invocation recorded in the plan; the baseline was re-emitted with
  `--out holonovel/testdata/rulesets/fixture --no-backup` and the stray backup
  directory it created inside `testdata/` was removed.
- **A4 — the gate's own remedy hint was wrong** (`build-package.mjs:88`
  printed `npm run build:covered-package`, which A3 shows does not fix the
  drift). Fixed in this increment: the message now prints the baseline re-emit
  invocation (matching `version-bump.ts:145-158`). Verified by inducing drift on
  the committed manifest, observing the new message, and restoring the file
  (`check-fixture-emitter` → PASS afterwards).
- **P3, recorded and closed — the emitter's `--baseline` flag only redirects
  the durable-parts source, not the freshness comparison.** Discovered while
  trying to probe A4 without touching the committed file; the comparison
  target is the `BASELINE_DIR` constant (`build-package.mjs:32`, `:80`). No
  demonstrated failure; not worth a flag.

## Verification summary

| Command | Result |
|---|---|
| `npm run tool-citation-check` | PASS, `token_drift: []` |
| `npm run validate:fast` | 0 errors, 3 pre-existing warnings |
| `npm run check-fixture-emitter` | PASS (6 files current) |
| `npm run check-starter-freshness` | PASS |
| `npm run check-fingerprint-sync` | PASS (both constants current) |
| `npm run build-order` | green (full check, propagate, typecheck, version) |
| `npm run check-roadmap` | PASS (15 sections) |
| `npm run check-registers:strict` | PASS |
| `npm run check-loop-artifacts` | PASS |
| `npm run check:fast` | exit 0, `check:fast: PASS` |

## User impact

Persisted Novels re-stamp `[data-stale]` once and installed ruleset packages
are held `[package-incompatible]` until `holonovel update` rebuilds them — the
sanctioned path for a release that moves §5.6/§5.16 (REQ-393, REQ-420,
REQ-423, REQ-424). No tool, API, or behaviour change.

## Action items

None. A4 was the only actionable finding and it shipped here; A1–A3 and the P3
note are documentation-grade consequences of executed steps.

LOOP PAUSED
