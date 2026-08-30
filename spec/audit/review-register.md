# Review Register — 2026-08-24

Findings and follow-through items from the after-action review loop. Each
entry carries a terminal disposition: `Resolved`, `Scheduled-roadmap`,
`Closed-P3`, or `Deferred-by-user`. The AAR references this file; it does not
restate it. The REQ-coverage register (`req-coverage.md`) and ROADMAP.md are
the tracking surfaces for the coverage backlog.

## Resolved

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

- **Redo-stack snapshot validator guard** — no demonstrated recurrence beyond
  the two fixed tools; reopen if a later bug demonstrates the class.
- **§6.6 REQ→S-ID cross-check validator** — the register correctly surfaced
  the REQ-192 gap without it; reopen only on demonstrated miss.
- **"Audit the §6.6 table" open-ended audit** — superseded by the REQ-192
  mapping fix; no demonstrated failure.

## Deferred-by-user

- **build-review skill §7 edit** (prior AAR Item 6): excluded by user decision.
