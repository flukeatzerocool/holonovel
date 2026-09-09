# Review Register — 2026-09-06

Findings and follow-through items from the after-action review loop. Each
entry carries a terminal disposition: `Resolved`, `Scheduled-roadmap`,
`Closed-P3`, or `Deferred-by-user`. The AAR references this file; it does not
restate it. The REQ-coverage register (`req-coverage.md`) and ROADMAP.md are
the tracking surfaces for the coverage backlog.

## Resolved

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

## Scheduled-roadmap

- **REQ-372/373 — supplementary ruleset import & dynamic tool registration**
  (Pattern Buffer close-out, 2026-09-06): bucket-E intended gap. S30/S31
  recorded `blocked` in `run_ruleset_pattern_buffer.ts`. Plan filed at
  `plans/2026-09-06-supplementary-import.md`; ROADMAP.md entry added. Open
  until the subsystem ships and S30/S31 un-block.

## Closed-P3 (recorded, no action)

- **DECISIONS.md gate-classification table absent** (content-integration scan,
  2026-09-04): REQ-137a contracts a gate-classification table enumerating every
  tool, but DECISIONS.md carries no such table and T151 has no harness
  implementation (REQ-137 is bucket-E builder-side, mapped to S6). No
  demonstrated failure — server badge gating is verified elsewhere (T148, the
  backfill badge block). Recorded; reopen only if a badge-gating drift is
  demonstrated.
- **Uncoupled behavioral configs** (integration review, 2026-09-04): RESOLVED
  2026-09-08 — the ten listed configs are now all coupled or reclassified
  (P55–P59 coupling rows; TTRPG_WORLD_PROMINENCE / TTRPG_NOVEL_PREVIEW_CHARS
  reclassified non-behavioral; TTRPG_CLIMAX_ACCELERATION and
  TTRPG_SYNTHESIS_AUTO_TRIGGER had already gained P1 / P47 rows). See Resolved.
- **REQ-388/T450 (holodeck_config discovery) implementation gap** — bucket-E
  intended gap, owed by tooling; unchanged by this wave.
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

## Deferred-by-user

- **build-review skill §7 edit** (prior AAR Item 6): excluded by user decision.
