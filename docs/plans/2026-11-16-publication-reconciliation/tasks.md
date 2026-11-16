# Tasks — Publication reconciliation

Revision 6. P1 is executed and green. **P2 and P3 are one atomic step** (pass 5
/d): landing the `update-server` deletion alone would either disable REQ-394a
vacuously or fail every publish until the pipeline passes `--delta-report`.
Line numbers were current at revision 6 — re-grep before deleting.

## P1 — Contract — EXECUTED

- [x] T1 Rewrote REQ-394a (`spec/02-requirements.md:4018`): gate results on the
      published revision plus one disposition per changed REQ (implemented /
      deferred / waived), derived from committed evidence, block-naming,
      deferral retained. No table format, no register named. `_Check:_` T84e
      kept; title kept to avoid provenance churn.
- [x] T1b Measured with the validator's own slice (`extractReqBodies` → **749**
      chars), not a line count — `wc -c` spans the header and reports ~790.
      749 < 800 (`scripts/validate.ts:198-201`). No split needed.
- [x] T2 §6.7 (`spec/03-build.md:2050-2057`): **additive only** — pass 4 (G4)
      established there was no rebuild directive to strike. "Scoping decision"
      untouched (REQ-314c owns it).
- [x] T3 Appendix V.4 (`spec/appendices-runbooks.md:106-116,130-139`):
      disposition obligation in happy-path step 5 (no renumbering, so "Step 5b"
      still reads true) plus a Recovery case.
- [x] T4 `assemble` clean; `check:fast` 46/46 PASS; `validate:sdd` 0 errors
      (427 pre-existing warnings). G7 attestation regenerated.

## P2+P3 — Script and pipeline, ATOMIC

### `scripts/update-server.ts`

- [x] T5 Delete, exhaustively: five constructions (`:301,373,376,379,411`);
      `invokeUpdate` (`:260-270`); `execSync` import (`:28`); `updateCommand`
      (`:68`); `Invoking:` prints (`:302,381,412`); `invokeEnabled` (`:67`) and
      six reads (`:303,343,382,390,397,418`); rewrite `:343` to
      `if (requiresEvidence)`; tail block **`:415-425`** — including the
      `reconcile(...)` at `:423`, which would otherwise record the baseline with
      no evidence (REQ-394a forbids exactly that); messages `:397-403,424`;
      `writeNoneDelta`'s dead `invoked` param (`:284`); header `:9-22`; the
      "outside a session" text `:363`.
      Gate: `grep -n 'invokeEnabled\|HOLONOVEL_INVOKE_UPDATE\|opencode run'
      scripts/update-server.ts` → empty.
- [x] T5b `scripts/lib/spec-update.ts:57-59`: drop the required `invoked` field
      and add `dispositions` to `FingerprintDelta` — without this, T5 breaks
      `typecheck` (TS2741). Renderer change stays T16.
- [x] T6b Derivation: `--coverage-register <path>` (fixtures); base-collapse the
      delta IDs (`REQ-` prefix, `^REQ-\d{3}`); sweep **deferral → removal →
      derivation → block**; map C/D → implemented, E → implemented when
      exercised-tests non-empty else waived, A/B → operator or block; place
      **below `:334`** so `--check` never derives.
- [x] T6c Fail when the register lacks a changed REQ entirely.
- [x] T6d `--dispositions <path>`: operator-authored rows for undetermined REQs,
      otherwise `exit 1` is unsatisfiable.
- [x] T7 Write the table into `fingerprint-deltas.json`; reconcile only on a
      complete record; `--check` writes no baseline and no delta record.
- [x] T8 Operator text: reconciliation, never rebuild.

### Pipeline

- [x] T9 `update` step (`steps.ts:296-328`): drop `autoUpdate`; `classifyDelta`
      (`:111-143`) returns the parsed report; widen `Ctx.state` (`:41-60`),
      `ensureDelta` (`:165-176`), callers (`:307`, `:339`), the `delta` step body
      (`:282`, `:290-291`), and the initializer (`run.ts:147-163`); write
      `.holonovel-state/delta-<server>.json`; pass `--delta-report` and
      `--dispositions`; pass `--check` when `ctx.flags.dryRun`.
- [x] T9b `record` (`:357-386`): `--dry-run` to `spec-update-record`, skip the
      DECISIONS spec-hash rewrite, skip the follow-on `--check` under dry-run.
- [x] T10 `publish/run.ts:37,96,111`; T11 `push-pipeline.sh:42,57`.
- [x] T12 `preflight.ts` `dryRun` in `PreflightOptions` (`:15-22`), exempt at
      `:82`, caller `steps.ts:203-210`.
- [x] T13 `harness` (`:352`): skip `test:all` when this run's `build-order`
      recorded a full suite on the same tree; fail closed otherwise.
- [x] T13b `registry` (`:513`): gate on `!ctx.flags.noPush`.
- [x] T13c `.githooks/pre-push:74-80`: drop the `opencode` remedy text (`:77`);
      keep `--check`, do **not** pass `--delta-report` (inert in check mode).

## P4 — Tests and renderer

- [x] T14 `holonovel/scripts/test-update-workflow.ts`: rewrite T84b (`:110-128`)
      and T84e (`:372-450`); retire T84c (`:136-145`), T84d (`:147-158`), and the
      dead scaffolding (`:129-134`); rewrite `:418-434` as "an incomplete record
      does not advance the baseline".
- [x] T15 `spec/appendices-reference.md`: rewrite T84b (`:1566`) and T84e
      (`:1567`) only. No T84c/T84d rows; T462, T492 untouched.
- [x] T16 `scripts/lib/spec-update.ts:88-90` and
      `scripts/spec-update-record.ts:136`: render the evidence kind and the
      disposition table; drop `invoked`/`deferred` from the rendered entry.
- [x] T17 `scripts/lib/script-discipline.ts:113-118` + fixture
      `scripts/test-script-tooling.ts:96-105`; run `test:script-tooling`.
- [x] T18 `npm run test:pipeline`: dry-run leaves `DECISIONS.md` and the baseline
      unchanged. **Stubbed** (`test-push-pipeline.ts:71`, `steps.ts:300-303`) —
      proves wiring and non-mutation only.
- [x] T18b **Acceptance control.** Non-stub case in `test-update-workflow.ts`
      (temp `HOLONOVEL_STATE_DIR`, synthetic register via `--coverage-register`,
      generated `--delta-report`): an undisposed changed REQ exits 1 naming it;
      a complete record reconciles. This is the only check reaching T6b/T7.

## P5 — Regenerate, verify, close

- [x] T19 `npm run build-order` — regenerates and re-gates; does not invoke
      `update-server`, so it is not the first use.
- [x] T19b Seed a temp state dir from `.holonovel-state/pipeline-fingerprints.json`
      (**not** a bare `mktemp -d` — with no baseline the delta block is skipped
      and the run measures nothing), generate the report
      (`npx tsx scripts/spec-delta.ts --server holonovel --base origin/main >
      <tmp>/delta.json`), then run `update-server --scope-by-fingerprint
      --delta-report <tmp>/delta.json`. Record the exception count in the AAR.
- [x] T20 `npm run assemble && npm run check:fast && npm run validate:sdd`.
- [x] T21 `./scripts/push-pipeline.sh --dry-run --allow-untracked`: `preflight`
      passes, `update` clears, and `.holonovel-state/pipeline-fingerprints.json`
      **and** `holonovel/DECISIONS.md` hash identically before and after. Proves
      wiring and non-mutation only.
- [x] T22 `ROADMAP.md` entry for the ruleset-side `opencode run` printers
      (`scripts/build-ruleset.ts:284`, `scripts/update-rulesets.ts:53`).
- [x] T23 CHANGELOG; `after-action-report` → `aar.md`; `npm run session:close`.

## Session handoff (2026-11-16)

**State on disk:** P1–P5 executed. The increment is one commit, staged at close.

**P5 evidence:**

- `build-order`: complete (assemble, check, propagate, typecheck, version sync).
- T19b derivation measurement: seeded temp state dir from
  `.holonovel-state/pipeline-fingerprints.json`, delta report from
  `spec-delta.ts --base origin/main` (Major). **120 changed REQs → 115
  implemented, 5 waived, 0 operator exceptions.**
- `assemble` + `check:fast` 46/46 PASS; `validate:sdd` 0 errors
  (427 pre-existing warnings).
- T21: `./scripts/push-pipeline.sh --dry-run --allow-untracked` cleared
  preflight and `update` without `--yes`; `holonovel/DECISIONS.md` and
  `.holonovel-state/pipeline-fingerprints.json` sha256-identical before/after.
  The run's `build-order` skipped its check pass (fingerprints already current
  on this tree), so the `harness` step ran `test:all` 56/56 — the fail-closed
  branch of T13.
- T22: ROADMAP section "Ruleset-side `opencode run` printers".
- T23: CHANGELOG entry; AAR; `session:close`.

**Traps recorded so they are not relearned:**

1. `FingerprintDelta.invoked` is **required** (`scripts/lib/spec-update.ts:58`).
   Deleting it without T5b fails `typecheck` (TS2741). Add `dispositions` in the
   same edit.
2. The tail block is `:415-425`, not `:415-419`. The `else` calls `reconcile`
   at `:423` — leaving it records the baseline with no evidence.
3. `invokeEnabled` is read **six** times (`:303,343,382,390,397,418`); `:397` is
   the one that keeps getting missed.
4. `--delta-report` is an **input**; its shape is `spec-delta.ts:69`
   (`requirements_changed {added, removed, modified}`). A flat set cannot express
   `removed`.
5. `--dispositions <path>` must exist, or `exit 1` is unsatisfiable.
6. Derivation goes **below** `:334`, else `--check` derives and blocks, breaking
   T21's clean `update`.
7. `T19b` must seed the temp state dir from `pipeline-fingerprints.json`; a bare
   `mktemp -d` has no baseline and measures nothing.
8. Measure REQ bodies with `extractReqBodies`, not `wc -c` (line count spans the
   header).
9. Do not run a further cold pass on P2–P5 — see the plan's "Review stop rule".

## Verification only

- [x] V1 `grep -rn HOLONOVEL_INVOKE_UPDATE scripts/ holonovel/scripts/ .githooks/`
      → zero (history in `CHANGELOG.md` and the register is exempt).
- [x] V2 `grep -rn "auto-update" scripts/` → zero.
- [x] V3 `grep -rn "Full rebuild\|full Build workflow\|opencode run" scripts/` →
      zero for the update path. Residual: the two ruleset-side printers
      (`build-ruleset.ts:284`, `update-rulesets.ts:53`) remain by design — they
      are out of scope here and scheduled by T22/ROADMAP.
- [x] V4 `grep -n invokeEnabled scripts/update-server.ts` → zero.
- [x] V5 `npm run typecheck` → clean (this is what catches B1-class breakage).
