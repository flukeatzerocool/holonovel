# After-action report — cross-badge undo stack access

Increment: `docs/plans/2026-11-13-cross-badge-undo/`
Plan: `plan.md` · Tasks: `tasks.md`
Status: complete

## What happened

`manage_history (action: undo)` now restores the newest snapshot across every
badge's stack (REQ-041a). Snapshots carry a stamped `_snapshot_seq` ordering
key computed as `1 + max` over the live undo stacks, so selection is
deterministic without a clock; the per-badge depth floor, truncation audit, and
append-only/checkpoint preservation are unchanged, and `redo` stays
caller-scoped (REQ-116). Two T10 assertions exercise the cross-badge path, the
newest-first selection, the all-stack empty conflict, redo from the caller's
stack, and badge preservation. REQ-041a's keying sentence was reworded,
`manage_history`'s description and `tool-definitions.json` regenerated, the
surface budget and DECISIONS token counts refreshed, F-P3B1-10 marked
`Resolved` in place, and the ROADMAP section removed.

Execution also found and fixed a sibling gap: `applyNovelState` restored the
snapshot's `badge` on undo, so an undo reversed badge switches — forbidden by
REQ-040d. The preserve set now carries `badge` in `"undo"` mode (Amendment A1,
cold-audited).

Verification: `test:persistence-guardrails` 27/27; `test:all` 56/56;
`build-order` complete (0 errors); un-piped `check:fast` → 41 passed,
`check:fast: PASS`.

## What went right

- The cold pass caught the register misreading twice (a case-sensitive grep,
  then the wrong disposition section). The second correction is the one that
  mattered: it kept the plan honest about `check-registers` not forcing the
  edit.
- The red probe did its job twice: it proved the selector failure, and it
  showed the redo assertion would have passed under the old behaviour, so the
  test gained a "GM note survives" clause before implementation.
- The delta discipline held: the REQ-040d gap was found mid-execution, written
  up as Amendment A1, cold-audited, and only then implemented.
- The 2867 → 2926 Holosuite anchor shift was caught by `test:all` and repointed
  before commit.

## What went wrong

- Two register-location errors in the plan reached the cold pass. Both came
  from reading a heading range instead of the nearest top-level heading.
- The data-format fingerprint hashes §5.6 prose, so a REQ-041a wording edit
  forced a data-format bump, a starter-Novel rebuild, and a fingerprint
  regeneration that surfaced only when `test:fingerprints` failed. The plan
  listed the fingerprint step as "not invalidated" — wrong, and the cold pass
  had marked that claim unknown.
- The first surface-budget `--write` updated the baseline but the gate still
  failed on the DECISIONS header counts; both have to be refreshed together.

## Recommendations

None actioned (all P3, record-and-close):

- `checkpoint_restore` and the pre-workflow restore now inherit badge
  preservation without their own assertion. A checkpoint assertion would close
  the gap if a session touches checkpoint semantics.
- The proofread register records 283 warnings while the live run produces 284
  at HEAD as well as after this change — pre-existing drift, not this
  increment's.
- Any §5.6 wording edit changes `DATA_FORMAT` by design (REQ-423); expect the
  starter-Novel rebuild and fingerprint regeneration in that session's steps.

LOOP PAUSED
