# Tasks — full-review sweep, chunk P3 (§5.4 decision workflows)

**Plan:** `plan.md` · **Status:** complete · **AAR:** `aar.md`
Actual results are recorded beside each step.

## Phase 0 — Baseline

- [x] `npm run check:fast` un-piped — exit 0, 37/37 PASS.
- [x] `npm run check` — exit 0, PASS.
- [x] Server harnesses — `test:workflow` 13/13, `test:character-creation`
      12/12, `test:output-contracts` 338/338, `test:backfill` 78/78,
      `test:lean-narrator` 10/10, `test:persistence` 41/41. **Gap:**
      `test:all` was not run here; see F-P3-4.
- [x] `git status --porcelain` clean at `48a3867`.
- [x] `git check-ignore` — the increment directory is trackable.
- [x] D5–D11 recorded in the sweep `worklist.md`.
- [x] Plan-gate evidence sidecar beside the stamped artifact.
- [x] Cluster partition re-derived: 19 + 13 = 32.

## Phase 1 — Code side

- [x] Surface enumerated with `file:line` anchors.
- [x] Cluster A reviewed (19 REQs).
- [x] Cluster B reviewed (13 REQs).
- [x] Every carrying harness opened; T32 and T635 found asserting a narrow
      subset.
- [x] Drain atomicity read branch by branch — F-P3-3 confirmed.
- [x] 32 verdict rows written (25 holds, 1 builder-side, 6 findings).

## Phase 2 — Spec side

- [x] Citation resolution per REQ; bucket inherited from the family row
      (`REQ-548d` through `REQ-548`).
- [x] Citation kind classified (S22 scenario, T38 Manual, T103 Automated).
- [x] Findings raised only where a cited test does not exercise the behaviour.

## Phase 3 — Triage and write-back

- [x] Findings triaged: three P0 fixed, one P0 baseline fixed as C0, five P1/P2
      scheduled.
- [x] `spec/audit/review-register.md` — dated `Resolved` and
      `Scheduled-roadmap` subsections.
- [x] `ROADMAP.md` — sweep bullets and trigger advanced to P3b; §5.4
      remediation and §5.4 citation repair sections added.
- [x] `CHANGELOG.md` — dated heading.
- [x] `tasks.md` closed; `aar.md` ends `LOOP PAUSED`.

## Exit gates

- [x] `npm run assemble` · `npm run check:fast` · `npm run check`
- [x] `npm run check-roadmap` · `npm run check-registers` ·
      `npm run check-loop-artifacts`
- [x] `npm run build-order` · `npm --prefix holonovel run test:all`
- [ ] `npm run session:close` (two commits: C0 baseline, C1 chunk); no push.
