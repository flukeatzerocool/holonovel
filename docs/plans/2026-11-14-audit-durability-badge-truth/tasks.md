# Tasks — Audit durability and badge truth (F-P1-4, F-P1-13)

Plan: `plan.md` (same directory). Depth: standard. Executable in one session.

## Preconditions

- [ ] `git status` clean at HEAD `739b362`; `npm run check:fast` PASS.
- [ ] Scratch `TTRPG_DATA_DIR` under `/tmp/opencode/`; `TTRPG_STARTER_NOVEL=off`
      for reproductions.

## Step 1 — enumerate (no assertion before this)

- [ ] Re-run both reproductions; record the envelopes verbatim.
- [ ] Superset check: every `mutation_class: "read"` registry action whose
      handler block calls `audit(`/`recordEvent`/`saveNovel` is in
      `MUTATING_READ_ACTIONS`; record any addition.
- [ ] Inverse check: every key in the set is classed `read`.
- [ ] Enumerate the 105 save-before-audit sites and the two-entry first-call
      path (`[session-boundary]` + own entry).
- [ ] Enumerate `set_badge` call sites with no active Novel in
      `holonovel/scripts/**`; record the fix per site.
- [ ] Grep `_Check:_` citations of REQ-030, REQ-040a, REQ-040c, REQ-066b,
      REQ-447, REQ-448 across `spec/` and `holonovel/scripts/`; record
      assertions that could move (T8, T9, T158, T349, T533, T534, T536).
- [ ] Confirm the capture round-trip (`novelToJSON` → `novelFromJSON` →
      `applyNovelState(..., "replace")`) and that `"replace"` preserves the
      undo/redo stacks, so C2 reassigns them from the capture.

## Step 2 — C1 classifier (red first)

- [ ] `holonovel/src/core/audit-gate.ts` with `MUTATING_READ_ACTIONS`,
      `appendsAuditEntry`, `capacityRefusal`.
- [ ] `badge-gate.ts`: rename the deny set, re-export the old name if needed by
      existing imports/tests.
- [ ] `core/index.ts` barrel re-export.
- [ ] `test-security.ts` unit assertions fail before, pass after: read → false,
      write/idempotent/destructive → true, the four known mutating reads → true,
      registry-absent → annotation fallback, unknown name → fail-closed.

## Step 3 — C2 dispatcher

- [ ] `guardToolCall`: preflight after the badge guard, before `surfaceGuard`,
      with the D4 exempt set.
- [ ] `registerTool` wrapper: compose `withCapacityAbort` inside
      `normalizeRefusal`; capture for appending calls; on a capacity throw
      restore via `applyNovelState(novel, novelFromJSON(captured), "replace")`
      plus the stack reassignment from the capture, re-save, rethrow.
- [ ] Measure the interchange-capture cost on the harness Novels; record it
      (fallback to a narrow capture if it exceeds 5 ms on a 3.6 MB Novel).
- [ ] T533 extended: `set_active` refused, disk `state_hash` unchanged.
- [ ] T786: cap one slot short of a two-entry call; no persisted mutation.

## Step 4 — C3 audit paths

- [ ] `auditForbidden` returns early at capacity.
- [ ] `compress_audit:` confirmation: audit before save; `sessions === 0` →
      restore snapshot, save, `STATE_CONFLICT` naming the raise-the-cap recovery.
- [ ] T533 compaction leg: compact admitted at capacity; refusal when nothing
      frees; confirmation with room appends exactly one entry.

## Step 5 — C4 badge truth

- [ ] `set_badge` no-Novel refusal (no audit, no mutation).
- [ ] `open_session` badge step guarded on an active Novel.
- [ ] T785: no-Novel refusal + `active_badge` null; then create → `[OK]`.
- [ ] Fix the step-1 enumerated harness call sites.
- [ ] Run `test-security`, `test-backfill`, `test-persistence`,
      `test-output-contracts`, `test-starter-novel`, `test-tool-definitions`.

## Step 6 — C5 spec

- [ ] REQ-447 before-any-write clause; REQ-066b no-Novel sentence +
      `_Check:_ T9, T785`; REQ-448 room qualifier.
- [ ] Appendix F: T785 and T786 rows; amend T9 and T533.
- [ ] `npm run assemble`; re-measure the three bodies (≤800 chars, ≤8
      sentences); record counts.
- [ ] `npm run build-order` for the §5.19 fingerprint.

## Step 7 — C6 suite

- [ ] `npm --prefix holonovel run test:all`; repoint drifted Holosuite anchors;
      re-run.

## Step 8 — C7 registers

- [ ] `review-register.md`: F-P1-4, F-P1-13 → `Resolved`, predicates at the
      post-change lines, tests named.
- [ ] `ROADMAP.md`: remove the § *Trust-core contract remediation (P1)* section.
- [ ] `npm run validate -- --write-register`.
- [ ] `CHANGELOG.md` entry under `2026-11-14`.

## Step 9 — close

- [ ] `npm run assemble && npm run check:fast` → trailing `check:fast: PASS`.
- [ ] `npm run check-registers`, `check-roadmap`, `check-loop-artifacts`.
- [ ] `npm run session:close`.
- [ ] AAR (`aar.md`) with the body re-measurements, the step-1 enumeration
      results, and the loop token.
