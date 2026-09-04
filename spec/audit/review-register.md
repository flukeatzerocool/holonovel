# Review Register — 2026-08-24

Findings and follow-through items from the after-action review loop. Each
entry carries a terminal disposition: `Resolved`, `Scheduled-roadmap`,
`Closed-P3`, or `Deferred-by-user`. The AAR references this file; it does not
restate it. The REQ-coverage register (`req-coverage.md`) and ROADMAP.md are
the tracking surfaces for the coverage backlog.

## Resolved

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

## Scheduled-roadmap

- **Backlog-clearance program waves 1–11** — the 145 A + 6 B REQs tracked in
  `req-coverage.md`, scheduled as the ROADMAP.md program. Includes:
  - **REQ-408 param-ceiling refactor** (create_character 15 params > ceiling 8)
    — Wave 2.
  - **REQ-193 staleness detection** — Wave 11 (add §6.6 mapping or
    disposition spec-side).
  - **REQ-380/389/390 ruleset-dependent REQs** — Wave 11; need a ruleset
    fixture decision (none exists in the workspace per AGENTS.md rule 4).
- **`--impl-audit=strict` enablement** — terminal step of the program.

## Closed-P3 (recorded, no action)

- **Uncoupled behavioral configs** (integration review, 2026-09-04):
  TTRPG_WORLD_PROMINENCE, TTRPG_CLIMAX_ACCELERATION, TTRPG_MAX_AVAILABLE_ACTIONS,
  TTRPG_STORY_BEAT_WINDOW, TTRPG_CAMPAIGN_MEMORY_MAX_FACTS,
  TTRPG_NOVEL_PREVIEW_CHARS, TTRPG_NARRATION_VALIDATION, TTRPG_STATE_GATE,
  TTRPG_AUTO_RECORD, TTRPG_SYNTHESIS_AUTO_TRIGGER are annotated behavioral with no
  §7.7.1a coupling row — pre-existing and tolerated by T450's `uncoupled` report;
  no demonstrated failure.
- **REQ-388/T450 (holodeck_config discovery) implementation gap** — bucket-E
  intended gap, owed by tooling; unchanged by this wave.
- **Redo-stack snapshot validator guard** — no demonstrated recurrence beyond
  the two fixed tools; reopen if a later bug demonstrates the class.
- **§6.6 REQ→S-ID cross-check validator** — the register correctly surfaced
  the REQ-192 gap without it; reopen only on demonstrated miss.
- **"Audit the §6.6 table" open-ended audit** — superseded by the REQ-192
  mapping fix; no demonstrated failure.

## Deferred-by-user

- **build-review skill §7 edit** (prior AAR Item 6): excluded by user decision.
