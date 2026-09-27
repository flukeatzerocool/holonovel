# Review Register — 2026-09-06

Findings and follow-through items from the after-action review loop. Each
entry carries a terminal disposition: `Resolved`, `Scheduled-roadmap`,
`Closed-P3`, or `Deferred-by-user`. The AAR references this file; it does not
restate it. The REQ-coverage register (`req-coverage.md`) and ROADMAP.md are
the tracking surfaces for the coverage backlog.

Each finding cites the predicate it rests on — the `file:line` of the
condition — not a gate's emitted message; a message alone is not evidence.

## Resolved

- **Codex `capture` action-contract conflict (REQ-321f vs REQ-347a)** (resolved
  2026-09-26): REQ-321f's `capture, kind, source_id` binding is narrowed to the
  provenance contract; per-kind capture is owned by REQ-321g (adventure) and
  REQ-347a (voice profile). General capture is scheduled on ROADMAP.md as a
  feature request, so `scripts/action-conflicts.ts` no longer reports two
  contracts for the `capture` action.

- **Conformance-gap remediation + prevention program** (2026-09-26, commit
  `65146ab` + follow-on): resolved the config-drift class and the false-C
  evidence class found by the spec↔code audit (REQ-129, REQ-097, REQ-239,
  REQ-241, REQ-096, REQ-092, REQ-084, REQ-030/REQ-055a, REQ-063b, REQ-405,
  REQ-246a, REQ-077). Prevention wired: config-surface parity gate (B1),
  false-C + Appendix F assertion ratchet with baseline (B2/B4), direct-test
  requirement for new bucket-C REQs (B3), and the conformance dossier in
  `check:fast`/pre-push (B5). The "Pre-existing config drift outside the
  unpushed range" and "SC-7 comment-only source citations" Closed-P3 entries
  below are superseded: both classes are now mechanically caught.
- **§7.6 config-default alignment, commits since `origin/main`** (2026-09-25):
  audited the 15 configs added and 4 re-annotated by the 27 unpushed commits
  against the solo-play north star and their REQ/coupling/classification
  surfaces. Resolved: (F1) `TTRPG_BELIEF_RECONCILIATION` was a phantom — REQ-465
  and REQ-468 now carry the disablement contract and `recomputeBeliefs` honors it
  (T629); (F2) `TTRPG_IDENTITY_MAX_CANDIDATES` was a phantom — new REQ-547 bounds
  the candidate set with oldest-first eviction (T630); (F3) REQ-473/REQ-479 now
  admit the configured non-developmental authored-card acceptance that
  `TTRPG_IDENTITY_AUTO_ACCEPT_AUTHORED=true` implements (T631); (F5) §7.6 defines
  `0` as eviction-disabled. (F4) causal validation stays default-on — aligned with
  "the rules govern every outcome"; (F6) the `Required` column is uniformly `No`,
  already zero-config-aligned. F7 below is Closed-P3.

- **Feature-parity residual remediation** (2026-09-25): (1) N1 — the behavioral-
  config contract was reconciled: Standing Rule 11 now distinguishes
  natural-language-tunable (`Behavioral`, Session-source coupling row) from
  mechanically-coupled (`Behavioral (mechanical)`) dimensions; §7.6 re-annotated
  ten non-Session configs; REQ-388b/c redefined against §7.6; the validator now
  rejects a plain `Behavioral` annotation whose cited P-rule is not Session-
  sourced. (2) R2 — `holodeck_config` is implemented in `buildSpecHealth`, with a
  real T450 in `test-tool-definitions.ts`; REQ-388 moved E→C. (3) N2 — Knowledge
  Corpus is bounded (REQ-546/T628; `TTRPG_CORPUS_MAX_DOCUMENTS` /
  `TTRPG_CORPUS_MAX_ACQUISITIONS`). (4) R3 — the REQ-372d waiver rationale was
  corrected to a build-scope basis (the MCP SDK supports runtime registration).
  (5) R1/REQ-137b — badge-filtered `tools/list` is implemented by wrapping the
  SDK ListTools handler; T151 extended to assert the filtered lists. (6) N3/R4
  minor fixes. Register buckets A0/B0/C387/E112.

- **Spec↔code conformance comparison SC-1…SC-6, SC-8** (2026-09-25): full
  498-REQ comparison (`spec/audit/spec-code-comparison-2026-09-25.md`,
  `scripts/compare-spec-code.ts`) found five false bucket-C REQs caused by
  bundled harness test names, and one config-name drift. Fixed in-session:
  added T116/T148/T149/T380 tests, whitelisted REQ-124 as a ruleset-dependent
  intended gap, added `checkTestNameInflation`, corrected two mislabeled test
  names, and made the briefing budget honor `TTRPG_MAX_BRIEFING_TOKENS`.
  SC-7 (comment-only citations) is `Closed-P3` below. `--impl-audit=strict`
  passes at A0/B0/C385/E113, 0 errors.
- **REQ-372/373 — supplementary ruleset import & dynamic tool registration**
  (2026-09-25): SHIPPED/closed. N1 shipped 2026-09-24 under the REQ-372d
  dynamic-registration waiver; Pattern Buffer S30/S31 now execute, and REQ-373
  is recorded as a waived intended gap in `holonovel/DECISIONS.md`. Reconciled
  with `ROADMAP.md` §"Supplementary ruleset import (REQ-372/373) — SHIPPED".
- **Residual remediation SC-6/SC-9** (2026-09-25, session 2): the
  `compare-spec-code.ts --bundles` report isolated the 6 falsely-C
  bundle-dependent REQs (123, 160, 175, 380, 389, 390). Added
  T195/T214/T441/T452/T453/T454/T455 tests, reclassified REQ-123 as a
  ruleset-dependent intended gap, and fixed SC-9 — a corrupt-hash package
  crashed the host at startup (`toolSchemas` hydrated during tool registration)
  and at health/list hydration, violating REQ-389b and defeating REQ-390 lazy
  hydration. `toolSchemas` now reads `tools.json` without hydrating,
  `validateDeclaredToolSchemas` preserves REQ-430, and startup/health/list guard
  per-package hydration. Register now A0/B0/C384/E114, 0 errors; `test:all`
  0 failures.
- **§5 subsection consolidation review** (full-document spec-review SR-9,
  2026-09-10): Appendix M's "§5 subsection exceeding 40 REQs SHALL trigger a
  maintainer review for consolidation" exercised across the nine sections over
  the threshold — §5.6 (260), §5.8 (127), §5.3 (84), §5.12 (82), §5.9 (76),
  §5.10 (74), §5.5 (58), §5.1 (51), §5.7 (49). Disposition: `Deferred-by-user`
  — each section's density is justified by its domain complexity; no immediate
  consolidation. §5.6 is a candidate for a future dedicated consolidation
  increment.
- **§7.6 behavioral-annotation drift** (baseline spec-review, 2026-09-09):
  normalized the config-table annotation to one canonical form — `TTRPG_AUTONOMY`
  dropped its `§7.7.1a` prefix and `TTRPG_SYNTHESIS_AUTO_TRIGGER` gained its
  `couples per P47` annotation (backed by a literal variable name in the §7.7.1a
  "Narrative Directive → Synthesis" row). `checkConfigCouplingAnnotations` now
  rejects a bare `Behavioral` row or the non-canonical prefixed form instead of
  silently skipping them. SR-1, SR-2, SR-3 closed.
- **Builder-side evidence follow-through** (AAR 2026-09-06): shipped 2026-09-06
  as three bounded increments — a conversion evidence harness + §5.2 coverage
  map (REQ-452/453, `check-conversion-evidence.ts`, T542/T543), a §6.7
  update-workflow harness (REQ-098/T84b, `test-update-workflow.ts`), and
  register alignment for the Holodeck/Wisdom/entry-point REQs (the §5.12
  disposition range-keyed bug corrected to section membership, so REQ-354 no
  longer misreports `implemented`). ROADMAP.md entry removed; see CHANGELOG.
- **SR-1 — machine-warning backlog** (full-document spec-review, 2026-09-06):
  zero-findings editorial campaign complete. All 15 increments plus the
  structural passes shipped as Editorial commits 2026-09-06 (`662efa1` →
  `584310c`); machine-flagged warnings 1,219 → 6, and all 6 residual are
  documented DP-3 non-actionable (DECISIONS.md structural-reconciliation
  disposition). No open items remain.
- **Backlog-clearance program waves 1–11** (2026-08-24 kickoff): complete.
  `req-coverage.md` now registers zero A and zero B REQs (A 0 / B 0 / C 302 /
  E 110); the wave-named REQs (REQ-408, REQ-193, REQ-380/389/390) are bucket C
  with exercised tests; the terminal step `--impl-audit=strict` is wired into
  `.githooks/pre-push`. Program closed; no ROADMAP.md entry remains.
- **SR-1 — §5 index table drift** (integration review, 2026-09-04): §5 section
  map rebuilt from actual REQ→section membership (98 missing REQs across
  §5.1–5.9 plus rows 5.21–5.23), and `validate.ts` now enforces completeness
  (`checkSectionIndexCompleteness`).
- **SR-2 — coupling row unresolvable token** (integration review): "NPC Mind"
  and the two `command (action: …)` tokens registered as aliases;
  `validate.ts` promotes unresolvable property tokens from warning to error.
- **SR-3 — TTRPG_NPC_MIND coupling mislabel + missing Session-source path**:
  P45 now names the NPC-mind keyword ("NPCs think for themselves"), a
  "Narrative Directive → NPC Mind" coupling row was added, and
  `checkConfigCouplingAnnotations` verifies behavioral-config annotations.
- **SR-4 — base capabilities outside the Holodeck model**: §7.7.0 now
  declares host base-capability state a self-contained non-coupling surface
  (escape hatch: future cross-property base capabilities register per REQ-370).
  Option A (declare non-coupling) chosen over wiring in property groups.
- **SR-5 — build-phase-map subsection count**: corrected 20 → 23.
- **SR-6 — holonovel/AGENTS.md tool-surface drift**: rewritten for the
  28-tool surface; T511 harness asserts the count.
- **F1 — term-fixing grammar in §5.2** (prior AAR): fixed.
- **F2/F3 — REQ-096/090/091 erroneous-citation and registration drift**:
  fixed.
- **F4 — proofreading-blocked REQs**: partial (remaining items shipped as
  implementation landed).
- **G2 — gather-tool tightening**: fixed.
- **Lockfile drift on deploy** (REQ-418 recurrence): `push-pipeline.sh` deploy
  now uses `npm ci` + lockfile-revert guard.
- **REQ-192 → S22 mapping** (methodology finding a): §6.6 row added in-session;
  the register correctly surfaced the gap. No further audit needed; the
  suggested S-ID cross-check validator is recorded below as `Closed-P3`.
- **remove_room / remove_thing redo-stack wipe** (methodology finding b): the
  snapshot-before-NOT_FOUND bug was fixed and regression-tested. The suggested
  validator guard is recorded below as `Closed-P3`.
- **§5.4 / §5.9 / §5.12 / §5.19 completion waves**: shipped 2026-08-24.
- **Deploy pull blocked by stale uncommitted tree edit** (P2, 2026-08-30):
  `push-pipeline.sh` step 9 now discards working-tree drift before
  `git pull --ff-only`, matching the AGENTS.md Two-Repo Workflow contract;
  verified REQ-418 deploy verification passes end-to-end.
- **2026-09-08 full-document evaluation follow-through** (top-3 recommendations
  + residual findings): (1) Standing Rule 11 scoped to the REQ-388b behavioral
  classes with build-time/presentation exemptions; the six remaining uncoupled
  behavioral configs wired with §7.7.1a coupling rows under new pattern rules
  P55–P59; TTRPG_WORLD_PROMINENCE and TTRPG_NOVEL_PREVIEW_CHARS reclassified
  non-behavioral in §7.6. (2) REQ-067 removed from the intended-gap whitelist,
  source-cited, and exercised by a new `test-help.ts` harness (T62/T118) — the
  help-tool category-override rendering gap was fixed in the same pass;
  REQ-454/T544 added so a server-cited REQ can never be silently whitelisted.
  (3) REQ-374a editorial de-duplication (12-name archetype enumeration →
  §7.7.0 reference) cleared the two residual proofreading warnings.
- **F6 — world-model "Known limitations" staleness** (2026-09-08 evaluation):
  the three Aug-2026 limitations recorded in holonovel/DECISIONS.md were
  verified RESOLVED — multi-direction door form parsed (`model.ts`
  convert_source), `create_thing` carries `location_type`
  (room/container/supporter), and parser `take` scans supporter/container
  things. Historical DECISIONS.md entries left as immutable build records; no
  open action.
- **World in Motion gating tension (T358 vs T389)** (2026-09-26): RESOLVED by
  spec decision — the two-gate model is canonical. `TTRPG_WORLD_REACTIVITY`
  (default active) gates the World in Motion section and its non-NPC entries;
  NPC goal-pursuit suggestions (REQ-339) additionally require
  `TTRPG_NPC_AUTONOMY=on` (default off). REQ-233a2 states the two gates,
  REQ-233a3's acceptance criterion sets both variables for the goal-pursuit
  assertion and adds the `NPC_AUTONOMY=off` negative case, and T358 was
  amended to match. No code change — `holonovel/src/index.ts:8969` gates the
  section on `worldReactivityOn()` and `:8970` seeds goal pursuit under
  `npcAutonomyOn()`. Surfaced by the B1 config-surface parity gate.
- **build-review skill §7 edit** (prior AAR Item 6): RESOLVED — §7 "Spec hash
  drift" gains a dated-narrative-entry check (confirm the human-readable
  `### Holonovel Spec Update — <date>` entry exists after assembly, not only
  the synced hash line). build-review `metadata.version` 2.3 → 2.4. External
  file, not in this repo. The same pass added a heuristic-check
  false-positive-budget item to plan-review §2 (version 2.3 → 2.4).
- **General codex capture (Scheduled feature request)** (resolved 2026-09-26):
  REQ-321n now specifies `manage_codex (action: capture, kind, source_id,
  update_source?)`; the tool dispatches capture by kind, REQ-321f points at the
  new contract, and the ROADMAP entry is removed. New evidence T397b/T397c/T402c.
- **§6.7 update self-invocation** (resolved 2026-09-26): `scripts/update-server.ts`
  executes the printed update command when `HOLONOVEL_INVOKE_UPDATE=1` (default
  off, never under `--check`); `push-pipeline.sh --auto-update` sets it.
  Exercised by T84c/T84d. ROADMAP entry removed.
- **Action-contract conflict error gate** (resolved 2026-09-26):
  `scripts/action-conflicts.ts --check` fails on any candidate group not in
  `spec/audit/action-conflicts-baseline.json`; report-only stays in `check:fast`
  and `--check` is wired into `check`. The five known groups are dispositioned;
  the one genuine overload (REQ-086a vs REQ-239a) is Scheduled-roadmap.
  ROADMAP entry removed.

## Scheduled-roadmap

- **General codex import materialization** (2026-09-26): ROADMAP.md
  §"General codex import materialization". REQ-321d per-kind import is
  unimplemented — only REQ-347b voice_profile and REQ-321e adventure import.
- **manage_session (action: compress) contract conflict** (2026-09-26):
  ROADMAP.md §"manage_session (action: compress) contract conflict". REQ-086a
  vs REQ-239a own one action with incompatible contracts; baselined in
  `spec/audit/action-conflicts-baseline.json`.

## Closed-P3 (recorded, no action)

- **Pipeline step-4 "full Build workflow required" flag** (`scripts/push-pipeline.sh
  --dry-run`, 2026-09-26): the step-4 message is REQ-314 rebuild-scoping output, not
  the REQ-394 pending-update block. The gate correctly permitted publication — the
  REQ-394 pending condition is a non-patch delta with *unchanged* fingerprints, and
  all five components had advanced. The confusing output came from the machine
  baseline (`.holonovel-state/pipeline-fingerprints.json`, `spec_hash 0a444e3b…`)
  lagging the hand-edited `**Spec hash:**` line in `holonovel/DECISIONS.md`
  (`88030ebd…`, commit `83f405e`). REQ-394 requires classifying against a
  machine-recorded baseline, never a hand-edited value, so the divergence is
  expected; a real pipeline run rewrites the baseline and self-heals. No
  demonstrated gate failure; reopen only if a Minor/Major delta with unchanged
  fingerprints is observed to publish.
- **Config drift + comment-only-citation false-C** (superseded 2026-09-26): the
  prior Closed-P3 dispositions for "pre-existing config drift" and "SC-7
  comment-only source citations" are withdrawn. The config items are fixed or
  dispositioned and gated (B1); the SC-7 12-REQ sample understated the class —
  the full audit found seven false-C REQs whose only exercised test asserted
  nothing relevant. This is a methodology finding: nominal evidence (an ID
  inside a bundled test name) is not evidence. Closed by the prevention
  mechanisms above.
- **DECISIONS.md gate-classification table absent** (content-integration scan,
  2026-09-04): RESOLVED 2026-09-25 — DECISIONS.md carries the REQ-137a table
  enumerating all 34 tools, and REQ-137b badge-filtered `tools/list` is
  implemented (the SDK ListTools handler is wrapped in `src/index.ts`); T151
  asserts both the table coverage and the filtered lists.
- **Uncoupled behavioral configs** (integration review, 2026-09-04): RESOLVED
  2026-09-08 — the ten listed configs are now all coupled or reclassified
  (P55–P59 coupling rows; TTRPG_WORLD_PROMINENCE / TTRPG_NOVEL_PREVIEW_CHARS
  reclassified non-behavioral; TTRPG_CLIMAX_ACCELERATION and
  TTRPG_SYNTHESIS_AUTO_TRIGGER had already gained P1 / P47 rows). See Resolved.
- **REQ-373 (dynamic tool registration) intended gap** — terminal builder-scope
  non-goal. The reference `holonovel` build registers ruleset-derived tools
  statically by design; the MCP SDK's runtime-registration capability is
  acknowledged and deliberately unused (the 2026-09-25 correction established
  the limitation is build scope, not stack capability). Recorded in
  `holonovel/DECISIONS.md` (a dated build record; the historical Waiver (5)
  entry is left immutable), dispositioned in `scripts/validate.ts`
  `INTENDED_GAP_CITED_DISPOSITIONS`, and exercised by T424's waiver branch. No
  re-activation trigger.
- **Counting-surface drift** (2026-09-08 evaluation, F3): the three prior
  instances (§5 index drift, build-phase-map subsection count, AGENTS.md
  tool-surface drift) are Resolved and now mechanically enforced
  (`checkSectionIndexCompleteness`, phase-map consistency, T511). The remaining
  manual count checks in the AGENTS.md before-commit checklist stay documented
  discipline; no demonstrated failure. Reopen only on a demonstrated count
  drift that escapes the enforced checks.
- **Redo-stack snapshot validator guard** — no demonstrated recurrence beyond
  the two fixed tools; reopen if a later bug demonstrates the class.
- **§6.6 REQ→S-ID cross-check validator** — the register correctly surfaced
  the REQ-192 gap without it; reopen only on demonstrated miss.
- **"Audit the §6.6 table" open-ended audit** — superseded by the REQ-192
  mapping fix; no demonstrated failure.
- **B3 — `narrative_world_model/` directory naming** (terminology sweep,
  2026-09-07): the vendor directory's name reads as the spatial "World" layer
  but holds narrative Ruleset Wisdom content (§11.4). Renaming ripples through
  §11.4, REQ-244a, and T541 (MANIFEST path). Deferred; a §11.4 gloss would be
  the low-cost alternative if the name causes a demonstrated misread.
- **B4 — bare "Wisdom" shorthand in §7.7 tables** (terminology sweep,
  2026-09-07): P5–P11 and §7.7.1a narrative cells shorten "Ruleset Wisdom" to
  "Wisdom" while the archetype keeps the full name; Appendix S already guards
  the D&D-stat collision. Consistent and low-risk; a table legend note is the
  optional mitigation.
- **C — "persona" prose senses** (terminology sweep, 2026-09-07): §8 uses
  "persona archetype" for verifier personae and §4 uses "system persona", both
  outside Appendix R's implementation-surface scope. No demonstrated failure;
  a §8 pointer distinguishing verifier-persona from the deprecated runtime
  sense is the optional mitigation.

- **Canonical tool-name guard (P7, review 2026-09-26): no automated guard added.**
  `scripts/validate.ts` already emits `termDrift` warnings against the §4
  Terminology table (`scripts/validate.ts:457-466,606`); the only recurrence was
  the 2026-09-25 terminology sweep (commit `acfc069`), and no bare-tool-name
  drift has been demonstrated since. Per AGENTS.md P3 ("open-ended 'worth a
  guard' with no demonstrated recurrence → record-and-close"), no gate is added.
  Reopen on a demonstrated bare `manage_X` reference where the canonical
  `manage_X (action: …)` form is required.

## Deferred-by-user

None.
