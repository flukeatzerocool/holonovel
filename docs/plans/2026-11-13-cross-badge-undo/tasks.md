# Tasks — cross-badge undo stack access

Increment: `docs/plans/2026-11-13-cross-badge-undo/`
Plan: `plan.md` · AAR: `aar.md`
Status: complete (see aar.md)

## Phase 0 — baseline and probes

- [x] 0.1 Baseline: `check:fast` → 41 passed, 0 failed, `check:fast: PASS`;
      clean tree at `d241eca`.
- [x] 0.2 Stack keys `state.ts:1292`; load defaults `:1757-1761`;
      `novelFromJSON` passes snapshot entries through (`:3376-3387`).
- [x] 0.3 Sibling probe: REQ-040d (`02-requirements.md:1465-1466`) confirms a
      badge switch is not undoable; REQ-041a/b/c, REQ-116, REQ-129, REQ-042
      recorded — none contradicted D2.
- [x] 0.4 Register probe: F-P3B1-10 under `## Resolved` (`:12`) in the
      2026-11-12 chunk, stale scheduling line at `:1098`; `check-registers`
      PASS before the edit. (The plan's location claim was corrected by the
      cold pass before execution; C-1 satisfied.)
- [x] 0.5 Create path calls no `novelSnapshot()` → no pre-drain needed
      (C-2 satisfied; the fresh-process tests confirm it).
- [x] 0.6 Red probe: both new T10 assertions failed on the old selector
      (`expected to contain "gm-note", got: []`); the redo assertion was
      tightened after the probe showed it could pass under the old behaviour.

## Phase 1 — state

- [x] 1.1 `nextSnapshotSeq` / `stampSnapshot` in `snapshot()`
      (`state.ts:2129-2145`).
- [x] 1.2 Redo's undo-stack push stamps the clone (`state.ts:2221`).
- [x] 1.3 `snapshotIsNewer` / `newestUndoSnapshot`; `undo()` selects the
      newest head across stacks and keeps the message (`state.ts:2148-2219`).
- [x] 1.4 `tsc --noEmit` → exit 0.

## Phase 2 — surface

- [x] 2.1 `manage_history` description reworded (`index.ts:4323`).
- [x] 2.2 REQ-041a keying sentence reworded (`02-requirements.md:1473`);
      `npm run assemble` → OK.
- [x] 2.3 `generate-tool-definitions.ts` → 37 tools; `tool-definitions-lint`
      PASS; `check-tool-surface` PASS (298 actions); `surface-budget --write`
      + DECISIONS token refresh (29,217 full / 25,619 standard);
      `tool-citation-check` PASS.

## Phase 3 — harness

- [x] 3.1 T10 cross-badge undo, newest-first, all-stack empty
      (`test-persistence-guardrails.ts:194`).
- [x] 3.2 T10 redo after cross-badge undo (`:218`).
- [x] 3.3 `test:persistence-guardrails` → 27 passed, 0 failed; full
      `test:all` → 56 passed, 0 failed.

## Phase 4 — close

- [x] 4.1 ROADMAP section removed; F-P3B1-10 marked `Resolved 2026-11-13` in
      place with the current predicate; topmost `2026-11-13` CHANGELOG entry.
- [x] 4.2 `npm run build-order` → complete (0 errors, 287 warnings; all
      pre-existing or policy-accepted); starter Novel rebuilt for the new
      data-format fingerprint; Holosuite `saveNovel` anchors repointed
      2867 → 2926.
- [x] 4.3 Un-piped `check:fast` → 41 passed, 0 failed, `check:fast: PASS`.
- [x] 4.4 `aar.md` written with `LOOP PAUSED`.

## Amendment A1

- [x] A1.1 `applyNovelState` preserves `badge` in `"undo"` mode
      (`state.ts:3579`); checkpoint restore and pre-workflow restore inherit
      it; import (`"replace"`) unchanged.
