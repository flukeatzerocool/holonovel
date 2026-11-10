# After-action report — §5.16–§5.17 capability citation gaps

Increment: `docs/plans/2026-11-10-5-16-5-17-capability-citation-gaps/`
Session date: 2026-11-10 · Plan: `plan.md` (v3, plan-review passed, fresh cold
pass) · Tasks: `tasks.md`

## 1. Outcome against the done bar

| Bar item | Result |
|---|---|
| 1. T459 asserts the recorded description budget over the live registry and that `tools_list_bytes` equals the default listing's catalog projection | Met — `test-output-contracts` 358/358 |
| 2. `tools/list` accepts `ruleset=<slug>`; T457 asserts the six behaviours | Met — `test:selection` 10/10 |
| 3. Red proofs recorded, suites green after | Met — three transcripts below |
| 4. F-P6b-27/F-P6b-28 `Resolved` with post-change predicates | Met — `spec/audit/review-register.md` |
| 5. Roadmap section removed, registers clean | Met — `check-registers`, `check-roadmap` |
| 6. `assemble && check:fast` green, un-piped | Met — see §5 |
| 7. `build-order` completes, no fingerprint advance | Met — `build-order` reports no fingerprint change; §5.16/§5.17 bodies untouched, Appendix F outside both section lists |
| 8. AAR ends `LOOP PAUSED` | Met |

## 2. What shipped

1. `holonovel/scripts/lib/tool-budget.ts` — one `recordedDescriptionBudget()`
   parser, imported by `test-tool-definitions.ts` (T642) and
   `test-output-contracts.ts` (T459). The duplicate-helper gate would have
   rejected a second inline copy.
2. `holonovel/src/index.ts` — `tools/list` reads `ruleset` from
   `params`/`params._meta`, refuses `scope`/`group` combinations and unknown
   slugs, selects only that package's registered tools, and includes the filter
   in the pagination signature.
3. `holonovel/scripts/test-selection.ts` — fixture package gains
   `lookup_alpha`, a `fixture2` package with `lookup_beta` is installed, and the
   T457 block runs the six ruleset assertions on a dedicated full-profile
   process at a 4096-byte listing cap.
4. `holonovel/scripts/test-output-contracts.ts` — T459 budget and reflection
   predicates.
5. Spec/registers — Appendix F T457 and T459 rows rewritten, F-P6b-27/F-P6b-28
   moved to `Resolved`, the roadmap section retired.

## 3. Red proofs (evidence the new assertions can fail)

- **T457, pre-change server:** `FAIL T720/T457/REQ-609/REQ-391b: … ruleset
  filter omitted the package's own tool` — 9 passed, 1 failed. Then green after
  the filter landed: 10 passed, 0 failed.
- **T459 budget predicate, mutation A:** `recordedDescriptionBudget()` returned
  `parseInt(...) - 200` (800 B). The harness failed naming 21 host tools over
  800 B, e.g. `manage_belief 994B`, `manage_archive 983B` — 356 passed, 1
  failed. Reverted.
- **T459 reflection predicate, mutation B:** the `_meta` strip step was removed
  so the served array was compared verbatim. The harness failed with
  `REQ-392 tools_list_bytes 112903 != default listing projection 113828` —
  356 passed, 1 failed. Reverted.
- **Final tree:** `test:output-contracts` 358/358, `test:selection` 10/10,
  `test:tool-definitions` 22/22.

## 4. Plan-review conditions

- **C-1** (reflection predicate red by removing the strip) — satisfied,
  mutation B above.
- **C-2** (cursor minted from the unscoped listing, rejected on a filtered
  request) — satisfied: the T457 block reads `nextCursor` from the unscoped
  listing and replays it with `ruleset`, asserting `[INVALID_INPUT]`.
- **C-3** (T457 row cites REQ-391a/391b/391c) — satisfied in Appendix F.
- **C-4** (`ruleset` + `group` refused and asserted) — satisfied in
  `index.ts` and the T457 block.

## 5. Verification

- `npm run validate` → 0 errors, 285 warnings (warnings informational).
  `PASS: Coverage register is current`.
- `check-registers`, `check-roadmap`, `check-script-quality` (132 scripts, 0
  hard), `check-script-discipline`, root and server `typecheck` → all pass.
- `npm run build-order` → completed; no contract fingerprint advanced
  (`package_format` and `data_format` unchanged because no fingerprinted
  section was edited).
- `npm run check:fast` → un-piped `check:fast: PASS` (see the session close).

## 6. Deviations from the plan

1. **The reflection predicate moved to the pre-Novel listing.** The plan
   compared `bound.result.tools`; the first run failed by 31 bytes because the
   served listing also carries the REQ-214c per-ruleset `resolve_mechanic`
   table-enum patch, which the reported projection excludes. The assertion now
   compares the pre-Novel default listing, where the projection and the served
   payload differ only by the REQ-379b annotation, and the Appendix F row names
   both exclusions. Evidence: `114807 != 114838` failure, then green.
2. **No `spec-update-record` step.** The plan (v1) carried it for a Minor delta;
   v3 dropped the REQ body edit, so the delta is a patch and the step does not
   apply.
3. **Proofread-register drift left alone.** Live warnings are 282 against the
   register's last batch (271). Appendix F table rows are excluded from the
   reference-prose extractor (`scripts/lib/parse-spec.ts:276-295` skips `|`
   lines), so this increment adds none of them; the drift predates the session
   and belongs to the ledger's own next batch. Record-and-close.

## 7. Findings

- **F-P6b-27, F-P6b-28** — `Resolved` in `spec/audit/review-register.md`, each
  with a post-change `file:line` predicate.
- **Proofread-register count drift (271 recorded vs 282 live)** — `Closed-P3`,
  record-and-close: the ledger is batch-scoped history and the delta predates
  this increment; no gate fails on it (validator emits a WARNING).
- **`[ERROR]` prefix on the new refusal** — deliberately deferred to the open
  Trust-core contract remediation roadmap section, which owns REQ-002's
  normalization. Recorded there by name in `plan.md` §4.3; no new row.

## 8. What went right / what went wrong

- Right: the cold review caught that the first reflection assertion would have
  locked in the pre-annotation figure and that the REQ body edit was an
  unforced `package_format` advance; dropping the body edit kept the delta a
  patch with no package invalidation.
- Right: the two mutations proved both T459 predicates red, so neither is a
  green-at-HEAD tautology.
- Wrong: the plan's `bound.result.tools` target missed the REQ-214c table-enum
  patch; the assumption was caught only at execution. Cost: one 8-minute
  harness run.
- Wrong: the first red-proof mutation left a dangling arrow-function body and
  needed a repair edit; the harness was not run in that broken state.

## 9. Loop status

Gates green, no open P0/P1 beyond the scheduled roadmap (15 roadmap items
remain, all P1/P2 and all scheduled). This increment adds no action items.

LOOP PAUSED
