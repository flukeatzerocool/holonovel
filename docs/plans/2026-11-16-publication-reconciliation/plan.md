# Plan — Publication reconciliation: an evidence gate the operator can actually satisfy

**Date:** 2026-11-16
**Kind:** planned
**Depth:** standard
**Increment:** `docs/plans/2026-11-16-publication-reconciliation`
**Revision:** 6 — P1–P5 EXECUTED (2026-11-16). Measured 120 changed REQs → 115 implemented, 5 waived, 0 operator exceptions; `check:fast` 46/46, `validate:sdd` 0 errors, dry run non-mutating. Verdict history: pass 5 found P2-NOT-READY (B1–B3); all pass-5 findings settled below; **P2 and P3 merged into one atomic phase**; no further cold pass on P2–P5 (rationale in "Review stop rule").

## Why

`./scripts/push-pipeline.sh --dry-run` blocks at the `update` step on a clean
tree with 124 unpushed commits. The stated remedy is an agent invocation the
operator cannot make from the environment the operator uses.

The delta class is legitimate (the week touched state-model and tool-surface
REQs). The defect is the evidence channel:

- `scripts/update-server.ts:301,373,376,379,411` build five `opencode run`
  commands; `HOLONOVEL_INVOKE_UPDATE=1` (`:67`) exists to fire them, and its own
  header (`:17-22`) states that deadlocks inside an opencode session — the only
  place this operator works.
- `invokeEnabled` is read at `:303,343,382,390,397,418`, so the invocation is
  threaded through the whole decision tree, including the tail auto-invoke block
  at `:415-419`.
- The alternative is a dated `Update-deferred` bullet (`:363-366`), so the
  gate's steady state is a deferral line on every publish.

### Findings

- **F1 — The gate demands a subprocess the operator cannot launch.** REQ-394a
  (`spec/02-requirements.md:4018`) admits two evidence kinds: an executed
  invocation, or a dated deferral. Neither records anything the agent did
  in-session. The real parity evidence — the strict implementation-coverage
  audit (`HOLONOVEL_IMPL_STRICT=1`, `scripts/publish/steps.ts:226`),
  `check:conformance`, and the harness suite — is not admitted.
- **F2 — The wording invites the rewrite the operator wants to avoid.** REQ-098
  defines the update as a gap audit with dispositions, but the generated text
  says "Full rebuild needed" (`scripts/update-server.ts:373`) and "full Build
  workflow required" (`:372`).
- **F3 — `--auto-update` is dead weight.** It only sets the env var
  (`scripts/publish/steps.ts:304`).
- **F4 — `test:all` runs twice** on a server-changing publish: once inside
  `build-order`'s full `check`, again at `scripts/publish/steps.ts:352`.
- **F5 — `--dry-run` refuses to start** without `--yes` on non-interactive
  stdin (`scripts/publish/preflight.ts:82`).
- **F4b — the registry check hangs off the mirror.** `registry` is gated on
  `didMirror` (`scripts/publish/steps.ts:513`), and `push_repo` returns `skip`
  without setting `didPush` when nothing is pending (`:474-477`), so either
  condition silently suppresses REQ-428 verification.
- **Corrected premise.** A rebuild is not what REQ-394a asks for, and
  regeneration cannot be more accurate: the spec states contracts, the server
  holds 76 commits of implementation with 56 harness commands behind it. What
  changes is the evidence channel and the wording.
- **F6 — `--dry-run` writes to `DECISIONS.md`.** `scripts/publish/run.ts:174-178`
  breaks only at the `stage` step, so `record` (`steps.ts:357`) runs; without
  `--dry-run` it writes the Spec Update entry (`spec-update-record.ts:228`).
  On the next real publish that marker makes `:217` skip, so the published entry
  is the dry-run's and the disposition table never reaches `DECISIONS.md`. The
  promise "change nothing" (`run.ts:29`) is false today.
- **The delta for this increment is Major, not Minor.** `REQ-032c` and
  `REQ-075j` are added, and families `032`/`075` sit in `STATE_MODEL_REQS`
  (`scripts/lib/spec-delta-classify.ts:7-11`), so `classifyDelta` returns
  `major` (`:44-48`). The contract applies to Minor *or* Major; only the class
  label was wrong.

## Done bar

**Done bar:** `grep -rn HOLONOVEL_INVOKE_UPDATE scripts/ holonovel/scripts/
.githooks/` returns nothing; REQ-394a and §6.7 carry a reconciliation evidence
path with no agent subprocess (REQ-394a body ≤800 chars, measured);
`./scripts/push-pipeline.sh --dry-run --allow-untracked` clears `preflight` and
`update` without `--yes`, and afterwards `holonovel/DECISIONS.md` and
`.holonovel-state/pipeline-fingerprints.json` are byte-identical to before;
`test:update-workflow`, `test:pipeline`, and `check:fast` green;
`session:close` commits.

The dry-run is expected to reach `update` and stop being useful there: `record`
runs with `--dry-run` (prints the entry, writes nothing) and its follow-on
`--check` is skipped, because in check mode `update` exits at
`update-server.ts:334` without writing the delta record, and `record --check`
then fails at `spec-update-record.ts:207-210` for a missing fingerprint-delta
line. Stating the skip is the point — it is not a silent exemption.

`--allow-untracked` is required because this increment's own directory is
untracked until close (`scripts/publish/preflight.ts:66-79`); a real publish
never needs it. Publish is out of scope — the operator is still fixing bugs.

## Scope

### In scope

1. **REQ-394a rewrite** — evidence becomes a reconciliation record: gate results
   on the published revision, plus a disposition for every changed REQ, derived
   from existing evidence where it exists. The **format** (a Markdown table)
   stays in §6.7 and Appendix V.4, never in the REQ body (Appendix M,
   contracts-not-implementations). Body must stay ≤800 chars
   (`scripts/validate.ts:198-201`); current body is 791.
2. **§6.7 wording** — remove the rebuild directive; state that the
   specification defines contracts and an update never rewrites conforming
   implementation. **Do not rename "the scoping decision"**: REQ-314c
   (`spec/02-requirements.md:2166-2167`) uses the term for the same summary, and
   `spec/03-build.md:2049` mirrors it. Narrow the edit to the rebuild language.
3. **Appendix V.4 runbook** (`spec/appendices-runbooks.md:93-131`) — gains the
   disposition step and reconciliation language. REQ-395b requires every
   workflow to have a runbook, and AGENTS.md treats V.4 as a pre-commit item.
4. **`scripts/update-server.ts`** — delete all five command constructions, the
   `invokeUpdate` function, `invokeEnabled` and its **six** reads
   (`:303,343,382,390,397,418`), the tail auto-invoke block, and the
   `HOLONOVEL_INVOKE_UPDATE` header text. Add evidence derivation (below).
   Replace "rebuild" with "reconciliation".
5. **Disposition derivation and ordering** — `update` derives a disposition per
   changed REQ and writes the table into `fingerprint-deltas.json`; `record`
   renders it into the Spec Update entry (`spec-update-record.ts:136`).
   **Nothing the gate validates is authored later than the gate** — the P0-2
   fix.
   - *Source.* The derivation reads the **committed coverage register**,
     `spec/audit/req-coverage.md` — one row per base REQ carrying `Bucket`
     and the exercised tests. No internals are imported and no second
     implementation is created, so `check-script-quality` C2 is satisfied by
     construction.
   - *ID normalization (pass 4, N2a).* `requirements_changed` carries bare
     suffixes **including sub-parts** (`scripts/spec-delta.ts:171,180-183`;
     `scripts/lib/parse-spec.ts:102`), while register rows are base IDs only
     (`scripts/validate.ts:2113`). The derivation SHALL prefix `REQ-` and
     collapse to the base ID before lookup. A `removed` REQ cannot appear in a
     register regenerated from the current spec, so removal SHALL NOT be
     treated as "not covered".
   - *Freshness (pass 4, N2b/N2d).* The register is trusted because `build`
     (`steps.ts:218`) and `gates` (`:246`) both precede `update` (`:297`), and
     `checkCoverageRegisterFresh` is a hard error in `validate`
     (`validate.ts:2786-2787`), which runs in both suite modes. The register
     itself carries no spec hash, so currency is established by that ordering,
     not by a value read from the file.
   - *Disposition mapping (pass 5, M6).* Bucket C → implemented (cited +
     exercised); D → implemented (cited, no `Check:`); **E → implemented when
     the exercised-tests cell is non-empty, else waived** — E is an
     `INTENDED_GAP_REQS` exemption (`validate.ts:1916`) excluded from the
     audit's error/warning loop (`:2773`), but many E rows do carry exercised
     tests (REQ-394 itself carries T462/T84e), so an unconditional `waived`
     would misreport them. A and B → not derivable, so they require an operator
     disposition or block. Distribution: 493 C, 117 E, zero A/B/D.
   - *Removal (pass 5, M2).* A `removed` REQ is dispositioned `waived`, not
     dropped: REQ-394a requires a disposition for **every** REQ the delta
     changed, and a deletion is a change. Sweep order: deferral → removal →
     derivation → block.
   - *Authoring channel (pass 5, B3).* `update-server` gains `--dispositions
     <path>`: a committed Markdown table the operator writes for rows the
     derivation cannot justify. Without it the `exit 1` would be unsatisfiable —
     the operator could never make a re-run pass. The pipeline passes the path
     and the table is rendered into the Spec Update entry by `record`.
   - *Precedence (pass 5, M1).* The dated-deferral check (`update-server.ts:343-369`)
     runs **before** the derivation, so an operator deferral still satisfies
     REQ-394a as the requirement states. The derivation runs only when no
     deferral is recorded.
   - *Placement (pass 5, N3).* The derivation sits **below** `:334`, so
     `--check` and dry-run never derive or block.
   - *Register path (pass 5, M7).* `--coverage-register <path>` lets a fixture
     point the derivation at a synthetic register; without it the A/B branch is
     untestable.
   - *Sub-part inheritance (pass 5, N2).* A sub-part inherits its base row's
     bucket (REQ-032c → REQ-032), so a brand-new sub-part can read `implemented`
     on base evidence. That is the intended reading of "derived from committed
     evidence" and is stated in the row definition.
     Rows SHALL NOT cite Manual T-IDs: `checkReqEvidenceLinkage` matches a
     Manual T-ID anywhere in `DECISIONS.md` (`req-checks.ts:704`), and the table
     lands there, so citing one would feed the table back into the next run.
   - *Applicability.* Required only when the delta is Minor or Major **and**
     fingerprints advanced. Note `classifyDelta` coerces `none` → `patch`
     (`steps.ts:134`), so "the none path" means "no unpublished delta", not a
     class the pipeline ever sees.
6. **Changed-REQ channel (N4, pass 5 B2)** — the set has no defined path into
   the gate today: `classifyDelta` parses `requirements_changed` and discards it
   (`scripts/publish/steps.ts:127-140`), and `Ctx.state.delta` holds a class only
   (`:43`). `--delta-report <path>` is an **input** file whose shape is exactly
   `spec-delta.ts:69` — `{ requirements_changed: { added, removed, modified } }`
   — so no new schema is invented. `classifyDelta` returns the parsed report
   (not a flat set, which cannot express `removed`), `Ctx.state` carries it, and
   the `update` step writes it to `.holonovel-state/delta-<server>.json` and
   passes the path. `.githooks/pre-push` keeps `--check` and therefore does
   **not** pass it (check mode never derives — pass 5 G3).
7. **`scripts/lib/spec-update.ts` + `scripts/spec-update-record.ts`** — replace
   the `invoked`/`deferred` rendering (`spec-update.ts:57-59,88-90`) with the
   evidence kind, so the entry stops claiming an invocation under a model that
   has none.
8. **Pipeline** — remove `--auto-update` (`publish/run.ts:37,96,111`;
   `publish/steps.ts:28,304`; `push-pipeline.sh:42,57`).
9. **F5** — `preflight.ts` gains a `dryRun` option in `PreflightOptions`
   (`:15-22`) and the caller passes it (`steps.ts:203-210`).
10. **F4** — `harness` (`steps.ts:352`) skips `test:all` when this run's
    `build-order` recorded a full suite on the same tree; fails closed otherwise.
11. **F4b** — `registry` (`steps.ts:513`) gates on a publish run
    (`!ctx.flags.noPush`), not on any push or mirror boolean.
12. **Dry-run writes nothing (N1/F6)** — three changes, which must hold
    together:
    - `update` passes `--check` when `ctx.flags.dryRun`, so no fingerprint
      baseline is reconciled (`update-server.ts:334` exits before the write).
    - `record` passes `--dry-run` to `spec-update-record`
      (`spec-update-record.ts:223` prints the entry and writes nothing) and
      skips the DECISIONS spec-hash rewrite.
    - `record` skips its follow-on `--check` (`steps.ts:384`) under dry-run,
      because check mode wrote no delta record and the fingerprint-delta
      assertion (`spec-update-record.ts:207-210`) would fail on an artifact the
      dry-run deliberately did not produce.
13. **Tests and catalogue** — retire T84c (`test-update-workflow.ts:136-145`),
    T84d (`:147-158`), and their now-dead scaffolding (`:129-134`: the
    "executed unless HOLONOVEL_INVOKE_UPDATE=1" comment and the fake-opencode
    fixture) in the harness only — no catalogue rows exist;
    `spec/appendices-reference.md` has only T84b `:1566` and T84e `:1567`.
    Rewrite T84b and T84e (`:372-450`); rewrite the failed-invocation case
    (`:418-434`). **Leave T462 alone** — it carries REQ-394 and REQ-398, neither
    of which this increment amends.
14. **`.githooks/pre-push:74`** — its gate calls `update-server --check` and its
    remedy text (`:77`) offers the disqualified path. Both follow the new
    contract.
15. **Retire the discipline rule** for `HOLONOVEL_INVOKE_UPDATE`
    (`scripts/lib/script-discipline.ts:113-118`) with its fixture
    (`scripts/test-script-tooling.ts:96-105`). Verified no orphan: the
    self-tests are independent assertions with no count.

### Out of scope

- **Publishing.** Still fixing bugs.
- **Consolidating the three push steps.** Rejected on evidence: `mirror`,
  `wiki`, and `wiki_mirror` target different repositories and are all
  deliberately advisory (`scripts/publish/run.ts:204`).
- **Renaming "the scoping decision"** — REQ-314c owns the term.
- **Rewriting T462, T492, or the REQ-394 body.**
- **`scripts/build-ruleset.ts:284` and `scripts/update-rulesets.ts:53`**, which
  print `opencode run` commands for the ruleset side. Scheduled on `ROADMAP.md`
  in this increment, not fixed here.
- **Historical records**: `CHANGELOG.md:3705,5866`,
  `spec/audit/review-register.md:2420-2423`,
  `docs/plans/2026-11-07-publication-engine-retirement/plan.md`.

### Settled decisions

- One disposition per changed REQ (derived from committed evidence where it
  exists; operator-authored only where it does not).
- Markdown table, rendered into the Spec Update entry.
- Dated deferral retained on REQ-394 and REQ-394a.
- Wiki/push-cluster coupling fix folded in.
- **Publication runs from the beginning, not `--resume`** (user decision,
  2026-11-16). No step may depend on a prior run's record; every step must be
  correct on a cold tree, and T21 hashes `DECISIONS.md` and the fingerprint
  baseline before/after precisely because nothing else would mask a bad write.

## Phases

### P1 — Contract — **EXECUTED (T1–T4, `check:fast` 46/46)**

- **T1** ✅ Rewrote REQ-394a (`spec/02-requirements.md:4018`): reconciliation
  record = gate results on the published revision + one disposition per changed
  REQ, derived from committed evidence, block-naming, deferral retained. Title
  kept ("Publication update evidence") to avoid churn in the provenance table
  (`spec/appendices-reference.md:1109`) and the §5 map. No table format, no
  register named — the body says "committed evidence".
- **T1b** ✅ Measured with the validator's own slice (`extractReqBodies` → **749**
  chars), not a line count: `wc -c` on the line reports ~790 because it spans the
  header. 749 < 800 (`scripts/validate.ts:198-201`), ~45 chars shorter than the
  body it replaced. No split needed, so P1 closed alone.
- **T2** ✅ **Corrected per pass 4 (G4):** there was no rebuild directive in §6.7
  to strike. Applied as purely **additive** — a contracts-not-implementations
  sentence plus the reconciliation-evidence sentence after the
  "recorded as applied" clause (`spec/03-build.md:2050-2057`). "Scoping
  decision" untouched.
- **T3** ✅ Appendix V.4: the disposition obligation folded into happy-path step 5
  (no renumbering, preserving the "Step 5b" pipeline reference) and a blocking
  case added to Recovery (`spec/appendices-runbooks.md:106-116,130-136`).
- **T4** ✅ `npm run assemble` clean; `check:fast` 46/46 PASS after regenerating
  the stale G7 attestation (`holonovel/src/generated/g7-attestation.ts`).

### P2+P3 — Script and pipeline, **one atomic step** (pass 5 M3/d)

P2 cannot land alone: after the deletion the `update` step still calls the script
without `--delta-report`, so the derivation sees an empty set and either passes
vacuously (REQ-394a unenforced) or fails every publish. Either outcome is
wrong, so these phases land together. The increment is one commit, so this costs
nothing.

- **T5** Delete the invocation surface, **exhaustively** (pass 5 M3): five
  command constructions (`:301,373,376,379,411`), `invokeUpdate` (`:260-270`),
  the `execSync` import (`:28`), `updateCommand` (`:68`), the `Invoking:` prints
  (`:302,381,412`), `invokeEnabled` (`:67`) and its six reads
  (`:303,343,382,390,397,418`) — including rewriting `:343` from
  `requiresEvidence && !invokeEnabled` to `requiresEvidence` — the tail block
  **`:415-425`** (not `:415-419`: the `else` at `:422-425` calls
  `reconcile(...)` at `:423`, which must not survive — it records the baseline
  with no evidence, exactly what REQ-394a forbids), messages `:397-403,424`,
  `writeNoneDelta`'s dead `invoked` parameter (`:284`), the header text
  (`:9-22`), and the "run the update outside a session" text (`:363`).
  Gate: `grep -n 'invokeEnabled\|HOLONOVEL_INVOKE_UPDATE\|opencode run'
  scripts/update-server.ts` is empty.
- **T5b (pass 5 B1)** `FingerprintDelta.invoked` is **required**
  (`scripts/lib/spec-update.ts:58`), so deleting the field breaks `typecheck`
  (TS2741) — and the `dispositions` field the table needs lives in that same
  interface. Move the `spec-update.ts` interface change **forward into this
  phase** (drop `invoked`, add `dispositions`) so P2 compiles. The renderer
  change stays T16.
- **T6b** Derivation: read the coverage register (`--coverage-register <path>`
  for fixtures), base-collapse the delta's IDs, sweep **deferral → removal →
  derivation → block**, apply the mapping (C/D → implemented; E → implemented
  when exercised-tests is non-empty, else waived; A/B → operator or block), and
  place it **below** `:334`. Exit 1 naming each REQ without a disposition,
  with a remediation line naming `npm run validate -- --write-register`.
- **T6c** Fail when the register lacks a changed REQ entirely.
- **T6d (pass 5 B3)** `--dispositions <path>`: the operator-authored Markdown
  table for undetermined rows. Without it `exit 1` is unsatisfiable.
- **T7** Write the table into `fingerprint-deltas.json`; reconcile only on a
  complete record; `--check` writes no baseline and no delta record.
- **T8** Operator text says reconciliation, never rebuild.
- **T9** `update` step (`steps.ts:296-328`) and surroundings: drop `autoUpdate`;
  `classifyDelta` (`:111-143`) returns the parsed report; widen `Ctx.state`
  (`:41-60`), `ensureDelta` (`:165-176`), its callers (`:307`, `:339`), and the
  `delta` step body (`:282`, `:290-291`); update the initializer
  (`run.ts:147-163`); write the delta report; pass `--delta-report` and
  `--dispositions`; pass `--check` when `ctx.flags.dryRun`.
- **T9b** `record` (`steps.ts:357-386`): pass `--dry-run` to
  `spec-update-record`, skip the DECISIONS spec-hash rewrite, skip the follow-on
  `--check` when `ctx.flags.dryRun`.
- **T10** `publish/run.ts:37,96,111`; **T11** `push-pipeline.sh:42,57`.
- **T12** `preflight.ts` `dryRun` option + `steps.ts:203-210` caller.
- **T13** `harness` skip (`steps.ts:352`), fail-closed on a missing record.
- **T13b** `registry` gating (`steps.ts:513`) on `!noPush`.
- **T13c** `.githooks/pre-push:74-80`: drop the `opencode` remedy text (`:77`);
  keep `--check` and do **not** pass `--delta-report` (inert in check mode,
  pass 5 G3).

### P4 — Tests and renderer

- **T14** `holonovel/scripts/test-update-workflow.ts`: rewrite T84b and T84e;
  retire T84c/T84d; rewrite `:418-434` as "an incomplete record does not advance
  the baseline".
- **T15** `spec/appendices-reference.md`: rewrite T84b (`:1566`) and T84e
  (`:1567`) only.
- **T16** `scripts/lib/spec-update.ts:57-59,88-90` and
  `scripts/spec-update-record.ts:136` — render the evidence kind and the table.
- **T17** `scripts/test-script-tooling.ts:96-105`; run `test:script-tooling`.
- **T18** `npm run test:pipeline` — dry-run does not mutate `DECISIONS.md` or the
  baseline. **Corrected per pass 4 (G2):** the suite sets
  `HOLONOVEL_PIPELINE_STUB=1` (`test-push-pipeline.ts:71`) and `update` returns
  before spawning (`steps.ts:300-303`), so "missing disposition blocks" and
  "complete record passes" **cannot** be asserted here. This proves step wiring
  and non-mutation only.
- **T18b** (defined under T19c below — the numbered entry is
  `holonovel/scripts/test-update-workflow.ts` non-stub case).

### P5 — Regenerate, verify, close

- **T19** `npm run build-order` — regenerates and re-gates; it does **not**
  invoke `update-server`, so it is not the first use (see T19b).
- **T19b** Run the derivation once against a **temp** state dir, never the live
  baseline. **Corrected per pass 4 (G1):** a fresh `mktemp -d` has no stored
  baseline, so `update-server.ts:271` skips the whole delta block and
  `:405-413` returns "no stored fingerprints" — measuring nothing. Seed the temp
  dir with `.holonovel-state/pipeline-fingerprints.json` first, then:
  generate the report first
  (`npx tsx scripts/spec-delta.ts --server holonovel --base origin/main >
  <tmp>/delta.json`), then run
  `HOLONOVEL_STATE_DIR=<tmp> npx tsx scripts/update-server.ts --server holonovel
  --scope-by-fingerprint --delta-report <tmp>/delta.json`. Record the exception
  count in the AAR. Measurement, not the control.
- **T19c** The control is T18b — a non-stub case in
  `holonovel/scripts/test-update-workflow.ts` (which already points
  `HOLONOVEL_STATE_DIR` at a temp dir): assert a changed REQ with no derivation
  and no operator disposition exits 1 naming the REQ, and a complete record
  reconciles. This is the only evidence reaching T6b/T7 — see the acceptance
  note below.
- **T20** `npm run assemble && npm run check:fast`.
- **T21** `./scripts/push-pipeline.sh --dry-run --allow-untracked` — assert
  `preflight` passes, `update` clears, and afterwards
  `.holonovel-state/pipeline-fingerprints.json` **and** `holonovel/DECISIONS.md`
  are byte-identical (sha256 before/after). **This proves wiring and
  non-mutation only:** check mode exits at `update-server.ts:334` before the
  derivation, and `test:pipeline` runs stubbed (`run.ts:143`, `steps.ts:300-303`,
  `:360-363`), so neither reaches T6b. T19c is the acceptance evidence.
- **T22** `ROADMAP.md` entry for the ruleset-side `opencode run` printers.
- **T23** CHANGELOG; `after-action-report` → `aar.md`; `npm run session:close`.

## Review stop rule

Five cold passes produced 21 → 9 → 12 → 12 → 18 findings, and the finding class
shifted from *missing work* (pass 1) to *implementation design* (pass 5: a
required interface field, an undefined input file, a missing authoring channel).
That shift is the signal to stop reviewing prose: those three defects are
cheaper to falsify by compiling (`typecheck` catches B1 in seconds) and by T18b
(catches B3 end to end) than by another cold read.

**No further cold pass on P2–P5.** The review burden moves to the gates:
`typecheck`, `test:update-workflow` (T18b), `test:pipeline` (T18), `check:fast`,
and `validate:sdd`. A pass is warranted only if a gate reveals something the
plan could not have anticipated.

## Blast radius

| Surface | Files |
|---|---|
| Normative | `spec/02-requirements.md` (REQ-394a body only), `spec/03-build.md` §6.7 |
| Runbook | `spec/appendices-runbooks.md` V.4 |
| Catalogue | `spec/appendices-reference.md` (T84b, T84e only) |
| Entry point | `scripts/update-server.ts` |
| Pipeline | `scripts/publish/steps.ts`, `publish/run.ts`, `publish/preflight.ts`, `scripts/push-pipeline.sh`, `.githooks/pre-push` |
| Record | `scripts/lib/spec-update.ts`, `scripts/spec-update-record.ts` |
| Tooling | `scripts/lib/script-discipline.ts`, `scripts/test-script-tooling.ts` |
| Derivation input | `spec/audit/req-coverage.md` (read-only; freshness owned by `validate`) |
| Harness | `holonovel/scripts/test-update-workflow.ts` |
| Scheduling | `ROADMAP.md` |
| Regenerated | `spec/audit/*`, `holonovel/src/generated/contract-fingerprints.ts`, `holonovel.md` |

No user data, schema, or deploy path is touched. The only irreversible-shaped
moves are deleting a flag and a discipline rule, both with self-tests.

## Review disposition

| Finding | Disposition |
|---|---|
| P0-1 body limit | Scope 1 + T1b (measure, split if needed) |
| P0-2 evidence authored after the gate | Real-run path closed (Scope 5); the dry-run path was re-opened by pass 2 → N1 and is closed by Scope 12 + T9b |
| P0-3 untracked preflight | Done bar uses `--allow-untracked`; T21 orders it after the increment is written |
| P1-1 pre-push | Blast radius + T13c |
| P1-2 Appendix V.4 | Scope 3 + T3 |
| P1-3 wrong line refs | Why + T5; pass 2 added the sixth site `:363`, now in T5 |
| P1-4 unsized backlog | Pass 2 measured **21** changed REQs (17 added, 4 modified). Derivation makes operator work exceptions only; T6b's exit 1 is the control, T19b the measurement |
| P2-1 preflight interface | T12 names both files |
| P2-2 dry-run mutates baseline | Scope 12 + T9; pass 2 showed the `--check`-only fix moves the failure to `record` (N1), so the three-part fix replaces it |
| N1 `--check` breaks `record` in dry-run | Scope 12; T9b (`--dry-run` render + skipped `--check`); done bar states the skip |
| N2 derivation source unattested/unexported | **Revised again:** consume the committed `spec/audit/req-coverage.md` (Bucket + exercised tests) instead of extracting `checkImplCoverage` and its 7 transitive helpers + 2 constants. No new module; C2 satisfied by construction. Scope 5 + T6b/T6c |
| N3 sixth env-var site `:363` | T5; `test-update-workflow.ts:129-134` (comment + fake-opencode fixture) added to T14's retirement |
| N4 no changed-REQ channel | Scope 6 + T9 (`classifyDelta` returns the set) + T13c |
| N5 delta is Major, not Minor | Why; T19/T19b |
| N6 T19 cannot be first use | T19 split into T19 (build-order, not first use) and T19b (derivation) |
| N7 disposition-free paths | Scope 5 *Applicability* |
| N8 table as its own evidence | Scope 5 *Row content* (no Manual T-IDs) |
| N9 task line ranges | Scope 13 line ranges corrected; `tasks.md` header claim dropped |
| R1 acceptance evidence never reaches the feature | T19b (temp state dir, measurement) + T19c (non-stub harness case, the control) + T21 restated to claim wiring and non-mutation only |
| R2 T9 scope too narrow | T9 names five call sites: `Ctx.state` `:41-60`, `classifyDelta` `:111-143`, `ensureDelta` `:165-176`, callers `:307/:339`, `run.ts:147-163` |
| R3 prose count off by one | Why lists five reads including `:390`. **Residual (pass 4):** Scope 4 still said "four reads" — corrected |
| N2(a) ID shape undefined | Scope 5 *ID normalization*: prefix + base-collapse; `removed` is not "uncovered" |
| N2(c) E→implemented is evidence-free | Scope 5 *Disposition mapping*: E → `waived` (an exemption, `validate.ts:1916`) |
| N2(d) freshness unimplemented | Scope 5 *Freshness*: established by `build`+`gates` ordering and the hard freshness error (`validate.ts:2786-2787`), not by a value in the file |
| R2 last consumers | T9 now also names the `delta` step body (`steps.ts:282,290-291`) |
| G1 T19b measures nothing | T19b seeds the temp dir from `pipeline-fingerprints.json` |
| G2 T18 assertions impossible | T18 narrowed to wiring + non-mutation; T18b is the control |
| G3 T13c inert `--delta-report` | T13c narrowed: pre-push keeps the pending-update case only |
| G4 T2 target did not exist | T2 executed as purely additive; no strike |
| G5 plan/tasks T18b mismatch | T18b cross-referenced from T18 |
| G7 blast radius understates T1b | Not triggered — no split needed (792 bytes) |
| G8 done bar ignores the no-advance branch | Noted: if fingerprints did not advance, `update-server.ts:309-311` exits 1 without `--allow-pending` |
| B1 `invoked` is a required field | T5b moves the `spec-update.ts` interface change into the atomic phase |
| B2 `--delta-report` undefined | Scope 6: input shape = `spec-delta.ts:69`; T19b generates the file first |
| B3 no authoring channel | T6d `--dispositions <path>`; runbook V.4 points at it |
| M1 deferral precedence unstated | Scope 5 *Precedence*: deferral runs first |
| M2 removed REQs get no row | Scope 5 *Removal*: removal → `waived`; sweep order stated |
| M3 T5 list not exhaustive | T5 now lists all nine items incl. the `:415-425` tail and `:423` reconcile |
| M4 tasks.md not updated | `tasks.md` rewritten to revision 6 |
| M5 six reads not five | all three plan sites now say six |
| M6 E→waived misreports E rows with tests | Scope 5 *Disposition mapping*: exercised-tests non-empty → implemented |
| M7 A/B branch untestable | T6b `--coverage-register <path>` |
| N1 wrong citation | Done bar cites `:201-203` (cold) or `:207-210` |
| N2 sub-part inherits base bucket | Scope 5 *Sub-part inheritance* |
| N3 derivation placement | Scope 5 *Placement*: below `:334` |
| (d) P2 alone disables or breaks the gate | Phases merged into **P2+P3, one atomic step** |
| G9 "none path" wording | Scope 5 *Applicability*: `classifyDelta` coerces `none`→`patch` (`steps.ts:134`) |
| P2-3 "scoping decision" drift | §6.7 narrowed; rename explicitly out of scope |
| P2-4 delta renderer | Blast radius + T16 |
| P2-5 T84c/T84d rows | T14/T15: harness only; no catalogue rows exist |
| P2-6 T462 | Explicitly out of scope; left unchanged |
| P2-7 second env site | T14 names `:418-434` |
| P2-8 registry skip relocated | T13b gates on `!noPush`, not a push boolean |
| P2-9 contradictory bar | Done bar uses the scoped grep |
| P2-10 format in REQ body | Scope 1: format stays in §6.7/V.4 |
| P3-1 citation drift | Evidence table below |
| P3-2 aar.md contradiction | `aar.md` rewritten |
| P3-3 other `opencode run` sites | T22 (`ROADMAP.md`) |
| P3-4 verified accurate | No action |

## Evidence

| Claim | Predicate |
|---|---|
| Body is 791 chars, limit 800 | `sed -n '4018p' spec/02-requirements.md \| wc -c` → 792; `scripts/validate.ts:198-201` |
| Five command constructions | `scripts/update-server.ts:301,373,376,379,411` |
| Rebuild wording | `scripts/update-server.ts:372-373` |
| Deferral is the in-session path | `scripts/update-server.ts:363-366` |
| `update` precedes `record` | `scripts/publish/steps.ts:297,357` |
| `record` owns the Spec Update entry | `scripts/publish/steps.ts:369` → `spec-update-record.ts:228` |
| Untracked blocks preflight | `scripts/publish/preflight.ts:66-79` |
| Dry-run passes no `--check` | `scripts/publish/steps.ts:308-318` |
| `--auto-update` only sets the env var | `scripts/publish/steps.ts:304` |
| `test:all` runs twice | `scripts/publish/steps.ts:226,352` |
| Non-TTY `--yes` refusal | `scripts/publish/preflight.ts:82` |
| Registry gated on the mirror | `scripts/publish/steps.ts:513`; skip path `:474-477` |
| Optional steps warn and continue | `scripts/publish/run.ts:204` |
| Pre-push hard block | `.githooks/pre-push:74-80` |
| Changed REQ set already emitted | `scripts/spec-delta.ts:69` |
| 76 commits touch `holonovel/src/` | `git rev-list --count origin/main..HEAD -- holonovel/src/` |
| Dry-run runs `record` | `scripts/publish/run.ts:174-178` (breaks only at `stage`) |
| `record` writes DECISIONS.md | `scripts/spec-update-record.ts:228`; skip-if-marker `:217` |
| `--dry-run` render path exists | `scripts/spec-update-record.ts:162,223` |
| Check mode exits before the delta record | `scripts/update-server.ts:334` |
| Coverage computation is gating and local | `scripts/validate.ts:2064`; linkage is report-only `:2651` — **not used**; derivation reads `spec/audit/req-coverage.md` instead |
| Register carries the derivation input | `spec/audit/req-coverage.md:4,6` (bucket legend + `Bucket` column) |
| `build` precedes `update` | `scripts/publish/steps.ts:218` vs `:297` |
| Dry-run `record` cannot fail on the absent delta | `spec-update-record.ts:136` guards on `delta.spec_hash`; `:223-226` writes nothing |
| `test:pipeline` is stubbed | `scripts/publish/run.ts:143`; `steps.ts:300-303,360-363` |
| Delta set is discarded | `scripts/publish/steps.ts:127-140`; `Ctx.state.delta` is class-only `:43` |
| This increment's delta is Major | `REQ-032c`/`REQ-075j` added; `spec-delta-classify.ts:7-11,44-48` |
