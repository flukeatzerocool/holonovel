# Review — U5: artifacts, independent verification, cadence, publication

46 verdict rows, one per budget unit in `plan.md`. A row is settled when its
claim is resolved against its predicate. Verdicts: `PASS`, `DEFECT` (a finding
with an ID), `builder-side` (terminal), `external-skill` (terminal).

Evidence class is `repo` unless the row names a command.

| Row | Unit | Claim settled | Predicate | Verdict |
|---|---|---|---|---|
| R1 | §9 lead-in | Four handoff documents plus `LICENSE.md`; version comment; DECISIONS six sections with the G7 `@section evidence` block | `spec/06-artifacts.md:1-45`; `holonovel/DECISIONS.md:2375-2377` | PASS |
| R2 | H1 | Test ID T36 resolves; ruleset-free provision present | Appendix F `T36`; `spec/06-artifacts.md:46` | PASS |
| R3 | H2 | T29 resolves; traceability mandate matches REQ set | `:47`; Appendix F `T29` | PASS |
| R4 | H3 | T36 and failure mode F4 both resolve | `:48`; `spec/01-foundations.md:221` | PASS |
| R5 | H4 | T35 and F4 resolve | `:49` | PASS |
| R6 | H5 | T33 and F4 resolve | `:50` | PASS |
| R7 | H6 | T29/T36 resolve; waiver rule matches Appendix F preamble | `:51`; `spec/appendices-reference.md:1434` | PASS |
| R8 | H7 | T41 resolves | `:52` | PASS |
| R9 | H8 | T43 resolves | `:53` | PASS |
| R10 | H9 | T44 resolves; badge-error form matches §7.6 | `:54`; `spec/04-runtime.md` badge contract | PASS |
| R11 | H10 | T45 resolves; REQ-099 present; REQ-100 resolves to its family (`REQ-100a`–`c`) | `:55`; `scripts/validate.ts:338-344` | PASS |
| R12 | H11 | F6 resolves to the failure-mode table; T198 carries the same defect class | `:56`; `spec/01-foundations.md:226` | PASS |
| R13 | H12 | T188 resolves | `:57` | PASS |
| R14 | H13 | T189 resolves; freshness wording matches §6.6 harness contract | `:58` | PASS |
| R15 | H14 | T190 resolves; diet list matches Appendix F T190 | `:59`; `spec/appendices-reference.md:1699` | PASS |
| R16 | H15 | T440 resolves | `:60` | PASS |
| R17 | H16 | T441 resolves; REQ-380c exists | `:61` | PASS |
| R18 | H17 | T442 resolves | `:62` | PASS |
| R19 | H18 | T443 resolves | `:63` | PASS |
| R20 | §9 tail | Waiver rule and the Markdown→REQ→code→test chain are consistent with H2/H6 | `:64-68` | PASS |
| R21 | §10 binding | Section binds the operator and adds no builder requirement | `spec/07-independent.md:1-11` | PASS |
| R22 | §10 operator procedure | Five operator steps; step 2 names "the four artifacts" while H14/T190 enforce five files | `:12-18` vs `spec/06-artifacts.md:59` | DEFECT U5-F3 |
| R23 | §10 verifier prompt | Load list omits §6 though steps 2 and 7 execute §6.6; step 10 requires a score the report format omits; cold checkout omits `LICENSE.md` | `:20-118` vs `spec/06-artifacts.md:59`; `:24` vs `:39-58`; `:98-102` vs `:111-118` | DEFECT U5-F1, U5-F2, U5-F3 |
| R24 | §10 DISPUTED rule | Operator re-run binding; non-reproducible fallback defined | `:121-127` | PASS |
| R25 | Appendix V lead-in + V.1 | Entry-point pointer claim names five commands, two emit it; scope says companion to §6.1's four workflows over ten runbooks; V.1 steps resolve to `build-ruleset`, `check-ruleset-*`, `test:ruleset-nonovel` | `spec/appendices-runbooks.md:3-49`; `scripts/build-ruleset.ts:55`; `scripts/update-rulesets.ts:48` | DEFECT U5-F4, U5-F5 |
| R26 | V.2 Convert | Entry point and steps resolve to §6.1/Appendix G/H | `:51-68` | PASS |
| R27 | V.3 Synthesize | Entry point and recovery resolve to §11.1 | `:70-83` | PASS |
| R28 | V.4 Update | Every step resolves: `update-server.ts`, `spec-update-record.ts`, step 5b in `push-pipeline.sh`, REQ-313/394/418/556 | `:85-126` | PASS |
| R29 | V.5 Remove | `manage_ruleset (action: remove)` and REQ-389c conflict behaviour | `:128-141` | PASS |
| R30 | V.6 Migrate Novel | `manage_ruleset (action: bind)`; REQ-380c one-way rule | `:143-156` | PASS |
| R31 | V.7 Update a ruleset | `update-rulesets.ts` summary, three package gates, staging swap, REQ-420/421/557 | `:158-192` | PASS |
| R32 | V.8 Migrate user data | `migrate-user-data.ts` dry-run default, REQ-423/096/065, `holonovel update` | `:194-226` | PASS |
| R33 | V.9 Proofread | Entry point and passes resolve; the fingerprint list omits §5.6, §5.21–§5.28, §5.31–§5.32 | `:228-258` vs `scripts/lib/contract-fingerprint.ts:37-43` | DEFECT U5-F6 |
| R34 | V.10 Exchange | `manage_artifact` four actions; six-file package matches T654/T656; REQ-096j/617/446 resolve | `:260-293`; Appendix F `T654` | PASS |
| R35 | `docs/workflow-cadence.md` | Per-session, weekly, monthly, quarterly claims match `weekly.ts` SWEEPS and `gate-cost-report.ts` (`--apply`, `--threshold`) | `docs/workflow-cadence.md:1-86`; `scripts/weekly.ts:34-41`; `scripts/gate-cost-report.ts:3-26,84-96` | PASS |
| R36 | `docs/publish-pipeline.md` | Ledger rows and staging guards resolve; rehearsal status says no live publish has completed | `docs/publish-pipeline.md:39-54` vs `.holonovel-state/publish-run.json` | DEFECT U5-F7 |
| R37 | `scripts/push-pipeline.sh` | Role header, exit contract, lock, delegation to `publish/run.ts` | `scripts/push-pipeline.sh:1-20` | PASS |
| R38 | `scripts/publish/preflight.ts` | Role, caller-owned exit, untracked/staged/identity/remote checks before any write | `scripts/publish/preflight.ts:1-12,55-63` | PASS |
| R39 | `scripts/publish/steps.ts` | Ordered registry; every ledger row's guard has a step | `scripts/publish/steps.ts:1-12`; ledger rows 14–22 | PASS |
| R40 | `scripts/publish/run.ts` | Role, exit contract, `--from`/`--only`/`--stage`/`--resume` semantics | `scripts/publish/run.ts:1-12` | PASS |
| R41 | `scripts/weekly.ts` | Six sweeps match the cadence doc; report path `spec/audit/weekly-<date>.md` | `scripts/weekly.ts:34-41` | PASS |
| R42 | `scripts/loop-audit.ts` | Metrics cover the cadence doc's signal table; `--check` thresholds are drift-based, not byte comparison | `scripts/loop-audit.ts:1-40`; `spec/audit/loop-audit.md:1-3` | PASS |
| R43 | `scripts/session-close.ts` | Subject from CHANGELOG heading, AAR token required, fast suite, `--split`/`--single` | `scripts/session-close.ts:1-17,32-43` | PASS |
| R44 | `spec/audit/loop-audit.md` | Committed snapshot is 2026-10-31 (672 commits, 1 increment) against a live 2026-11-15 (808, 95) | `npx tsx scripts/loop-audit.ts --check` | DEFECT U5-F8 |
| R45 | `.github/workflows/publish.yml` | Full-history checkout guards the `spec-delta --base` failure; `npm ci` only | `.github/workflows/publish.yml:38-46`; ledger row 2026-10-31 | PASS |
| R46 | `docs/plans/README.md` | Increment layout lists plan/tasks/aar only; review increments carry `review.md` | `docs/plans/README.md:16-20` | DEFECT U5-F9 |

## Amendments

- **R25's unit widened.** `plan.md`'s budget assigned the ten runbooks but not
  Appendix V's lead-in (`:3-11`). R25 now covers the lead-in plus V.1, so every
  content line of the appendix is assigned and the row count stays 46.
- **Phase 0 re-measurement count corrected.** `plan.md` EV13 recorded zero
  commits after the baseline window. The query form was wrong: `git log
  --since=2026-11-15` is parsed as UTC midnight and matches nothing on this
  offset. With `--since=2026-11-14T23:59:59` the window holds **11** commits
  (2026-11-15). 11 < 26, so the trigger is still unmet; the corrected number is
  recorded in the AAR.

## Findings

| ID | Class | Priority | Disposition |
|---|---|---|---|
| U5-F1 | drift | P0 | fixed: §10 load list gains §6 |
| U5-F2 | drift | P0 | fixed: report format gains the confidence score and weights |
| U5-F3 | drift | P0 | fixed: `LICENSE.md` named in the operator step and cold-checkout definition |
| U5-F4 | process | P0 | fixed: the pointer claim names the two commands that emit it |
| U5-F5 | drift | P0 | fixed: the appendix states its ten runbooks and their two families |
| U5-F6 | drift | P0 | fixed: the fingerprint list cites its authority instead of an incomplete inline list |
| U5-F7 | drift | P0 | fixed: rehearsal status records the completed 2026-11-09 live run |
| U5-F8 | drift | P0 | fixed: snapshot regenerated at HEAD |
| U5-F9 | drift | P3 | fixed: increment layout documents `review.md` |
