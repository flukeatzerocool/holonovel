# AAR — §5.16/§5.17 ruleset surface remediation

Date: 2026-11-10 · Increment: `docs/plans/2026-11-10-5-16-5-17-ruleset-surface-remediation/`
Outcome: complete landing, one commit, no push.

## 1. What was done

- **Slice A — scope, annotation, health, suggest.** `tools/list` entries now
  carry `_meta.ruleset` (`<slug>` or `null`) and `_meta.inapplicable` under
  `scope=all`; the measured surface and `tool-definitions.json` carry the same
  annotation. `spec_health.ruleset_health` reports per-slug confidence, indexed
  counts, MUST-action coverage, defect count, and verification dispositions
  (undeclared fields report `not-declared`) plus a `combined` summary; the
  Player badge sees only the active Novel's section. `run_command
  (action: suggest)` emits prefixed package tools for a matched intent.
- **Slice B — identity, import/export, codex.** Bind refuses mechanics-derived
  state before any write; switching audits both endpoints; archive import
  validates the incoming ruleset and export names it; roster entries carry the
  staging ruleset; the codex gains a ruleset axis (set/capture defaults, list
  filter, mismatched-import refusal).
- **Slice C — metrics, budget, lifecycle.** Install registers tools, declared
  resources, and prompts immediately with rollback; `ruleset://{slug}/{anchor}`
  resolves the search pointer; `ruleset_index_bytes` is reported without
  hydrating; `tools/list` paginates on a byte budget with a scope-bound cursor;
  the package tool budget is enforced at load and by the package gate; the
  license set equals Appendix U's exact values and `build-ruleset` records
  `--license`.
- **Close-out.** Six findings resolved, F-P6b-9's `ruleset://` clause split out
  as F-P6b-9a and resolved; roadmap section retired; coverage register
  regenerated; one dated CHANGELOG entry; DECISIONS records the prefix map and
  the interpretation decisions.

## 2. Evidence

| Check | Command | Result |
|---|---|---|
| Target harness | `npm --prefix holonovel run test:ruleset-surface-remediation` | 16 passed, 0 failed |
| Sibling harnesses | `test:output-contracts` 358/0; `test:selection` 10/0; `test:tool-definitions` 17/0; `test:competitive-gaps` 30/0; `test:ruleset-gates` 22/0; `test:ruleset-nonovel` 9/0; `test:tool-surface` 13/0; `test:surface-guards` 15/0; `test:backfill` 99/0; `test:persistence` 45/0 |
| Full server suite | `npm --prefix holonovel run test:all` | 56 passed, 0 failed |
| Holosuite | five tiers after `refresh-predicates --write` | all PASS |
| Fast gate | `npm run check:fast` un-piped | `check:fast: PASS` |
| Spec validation | `npm run validate` | 0 errors, 286 warnings |
| Sync | `npm run build-order` | complete |
| Registers | `check-registers:strict`, `check-roadmap`, `check-loop-artifacts` (inside `check:fast`) | PASS |

## 3. What went right

- The cold plan review caught two real defects before execution: T448 already
  existed for the codex ruleset axis (so no new token was needed) and
  `RosterEntity` had no `ruleset` field (so REQ-386a could not be implemented as
  written). Both would have produced a false citation or an unbuildable bar.
- The existing `test-ruleset-surface-remediation` harness was the right home;
  extending it kept token ownership in one place.
- `npm run refresh-predicates -- --write` repaired 21 evidence anchors after the
  source insertions, so the holosuite tiers went green without hand-editing.

## 4. What went wrong and its disposition

- **The first cold pass was FAILED.** Fixed in the plan and re-reviewed on the
  diff; the final independent artifact records the resolution. Two residual
  blast-radius nits were corrected under condition C-1.
- **Export/import initially tested through `manage_novel`.** Those actions are
  retired aliases; the live path is `manage_archive`, which delegates to the
  same raw handler. Tests now use `manage_archive`.
- **The plan's emitter-refusal half for REQ-430 is not implementable here.**
  `build-ruleset` records intake and prints the Build invocation; it emits no
  package (F-P6b-7). The budget is enforced at load and in
  `check-ruleset-package`, which the Build workflow runs. Recorded as plan
  amendment §14.1; the emitter is already scheduled under F-P6b-7, so no new
  roadmap row.
- **T651 was already exercised.** The plan's "extend T651" step would have
  duplicated a token across harnesses; install-time registration is asserted by
  T453/T454 instead (amendment §14.2).
- **The `_meta` annotation moved the measured surface.** Regenerated
  `tool-definitions.json`, wrote `spec/audit/tool-surface-baseline.json`, and
  updated the recorded budgets in DECISIONS.
- **The config-surface gate rejected the two new environment variables.**
  Declared them in §7.6 (presentation/build-time budgets, no fingerprint
  membership) and recorded their classification in DECISIONS.
- **REQ-454 rejected six whitelisted REQs now cited in server source.**
  Removed REQ-383–REQ-387 from `INTENDED_GAP_REQS` and REQ-012 from the same
  list, with the rationale recorded in the validator comment.

## 5. Open items

- None new. F-P6b-7 (committed package emitter) and F-P6b-15 (supplement
  provenance) remain the already-scheduled owners of the deferred halves.
- Publication is not part of this increment; it stays user-authorized.

LOOP PAUSED
