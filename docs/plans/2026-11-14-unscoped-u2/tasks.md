# Tasks — U2: build process and tooling review

Dependency-ordered breakdown of `plan.md`. Task IDs mirror the plan's numbered
steps one-for-one (T1–T20), so the AAR can cite either form. Each task names the
artifact it leaves behind.

## Phase 1 — Build the mapping, then read

- [ ] **T1** Read each consumer in the enforcement table once
  (`scripts/validate.ts:1332-1413, 2455-2495`; `scripts/lib/req-checks.ts:126-140`;
  `scripts/check-registers.ts:9-10,54`; `scripts/check-roadmap.ts:246`).
  Artifact: mapping table in `review.md` with a severity per consumer.
- [ ] **T2** Read `scripts/lib/phase-map-hash.ts` and
  `scripts/assemble.ts:110-169` (including `ALLOWED_SOURCE_FILES`, `:120-127`).
  Artifact: the roster, hash, and two-artifact facts that settle C-6 and `D6`.
- [ ] **T3** Read `scripts/lib/spec-delta-classify.ts` in full (62 lines) and the
  `shape` fed at `scripts/spec-delta.ts:190-200`. Artifact: the delta-class
  facts that settle C-2, C-3, and C-11.
- [ ] **T4** Read the three hooks `.githooks/{pre-commit,pre-push,commit-msg}`
  and `scripts/lib/gate-run-manifest.ts`. Artifact: one failure-mode line per
  hook; settles C-12.
- [ ] **T5** Read `scripts/version-bump.ts` and `scripts/spec-update-record.ts`
  far enough to settle C-3's DECISIONS.md writer. Artifact: the writer anchor.
- [ ] **T6** Create `review.md`: header, mapping table, 35 numbered rows with
  surface and anchor. Artifact: `review.md` skeleton.

## Phase 2 — Write the verdicts

- [ ] **T7** §6.1–§6.7, 16 rows. Artifact: 16 verdicts (`D2` decides
  `builder-side`).
- [ ] **T8** Cross-cutting probes: C-8 (37 sub-workflows), C-9
  (`run_pattern_buffer` path), C-10 (two-batch construction audit).
  Artifact: three probes resolved inside their rows.
- [ ] **T9** Map phase rows, 15 rows, applying the gate's direction
  **directive ⊆ row** (`validate.ts:1370-1376`). Artifact: 15 verdicts.
- [ ] **T10** Map header, loading conventions, file index, peak set — 4 rows;
  apply C-1, C-5, C-6, C-7. Artifact: 4 verdicts.
- [ ] **T11** Resolve C-4 (three rosters), C-11 (five fingerprint components),
  C-12 (gate-run record), and record the hooks' failure modes in the mapping
  table rather than as verdict rows. Artifact: candidates complete, no
  "unverified" left.

## Phase 3 — Triage and fix

- [ ] **T12** Rank every finding P0–P3 per `AGENTS.md` "Review-loop governance".
  Artifact: severity per finding in `review.md`.
- [ ] **T13** Apply the bounded P0 prose corrections (§6 and/or the map), and
  re-read each hunk against the reference-prose bar
  (`validate.ts:639-655` — grade 18, no 45-word sentence, no stacked
  conditions). Artifact: the fix hunks; ≤12 lines or stop and amend the plan.
- [ ] **T14** Record any §6.3/§6.4.2 hit for regeneration at T19 — do not run
  `build-order` here (it runs the full `check`, which needs `aar.md`).
  Artifact: a flagged row in `review.md`.
- [ ] **T15** Write register rows with one dated `### 2026-11-14 U2 build
  process and tooling` heading **per disposition section that receives rows**,
  and any `ROADMAP.md` P1 section in the same step. Artifact: register and
  roadmap coupled under `check-registers --strict`.

## Phase 4 — Bookkeeping, AAR, gates, close

- [ ] **T16** Update `worklist.md:92` (exit evidence + the EV9 note) and the
  `ROADMAP.md` trigger to name U3. Artifact: program record advanced (`D7`).
- [ ] **T17** Write the `CHANGELOG.md` entry dated `2026-11-14`.
- [ ] **T18** Write `aar.md` ending `LOOP PAUSED` (row count, findings by
  severity, dispositions, delta class). If `LOOP OPEN`, disposition the named
  item and re-run. Artifact: `aar.md`, which unblocks T19.
- [ ] **T19** Run the gates un-piped, capturing exit codes:
  `assemble` (conditional) → `check-registers --strict` → `check-roadmap` →
  `build-order` (conditional, `D5`) → `check-fingerprint-sync` → the guarded
  co-change check on the staged fix set (`git add` first; `--base HEAD` cannot
  see an uncommitted diff). Record `check-container-image` as an environment
  Unknown if it cannot run.
- [ ] **T20** Amend `aar.md` with the measured gate results (loop step 7c), then
  `npm run check:fast` un-piped (`check:fast: PASS`), then
  `npm run session:close`.
