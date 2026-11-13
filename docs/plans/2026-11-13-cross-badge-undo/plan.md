# Plan — cross-badge undo stack access

Status: draft (plan-review pending) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-13-cross-badge-undo/`
Rollback cost: 1 (server core, one harness, one REQ body, roadmap, changelog;
reversible in one commit)
Evidence class: repo only (no web, no user-supplied content)
Trust boundary: every premise below is `repo` evidence read in this session.

## 1. Objective

Take the first **unblocked** P1 roadmap section, *Cross-badge undo stack
access* (`ROADMAP.md:25-34`), and make `manage_history (action: undo)` reach
the most recent mutation under **any** badge instead of only the caller's
stack, while keeping the per-badge depth floor and the append-only/checkpoint
preservation rules (REQ-041a, REQ-041b).

Why this is "next": the section above it, *§5.6 clock and combat-report
remediation*, is narrowed to T161 and blocked on *REQ-124 NPC damage
resolution* (`ROADMAP.md:15-23`, `review-register.md:2334-2341`). The
remaining P1s are larger remediation bundles; this one is a single contract
gap with an explicit close condition.

**Done bar:** the close condition is exercised in a harness, the tracking
surfaces are closed, and the fast gate is green — itemised below.
- an undo invoked under a second badge reverses a mutation initiated under the
  first, asserted in a harness;
- the existing T10 assertions (depth floor, truncation audit, refused-call
  snapshot behaviour, redo after undo) stay green;
- `ROADMAP.md` no longer carries the section **and**
  `spec/audit/review-register.md` marks F-P3B1-10 resolved in place with a
  current predicate and no stale "Scheduled under" line;
- `CHANGELOG.md` carries a `2026-11-13` entry naming the behaviour and the REQ;
- `npm run assemble && npm run check:fast` green (41/41, trailing
  `check:fast: PASS`).

Baseline (this session, before any edit):
- `npm run status`: version `2026.11.13`, 71 unpushed commits, 11 open
  roadmap items, last publish `2026-11-09T04:30:29Z`. Publication is out of
  scope.
- `git status --porcelain`: clean, HEAD `d241eca`.
- `npm run check:fast`: **41 passed, 0 failed**, trailing `check:fast: PASS`.

## 2. Findings, predicates, dispositions

| Predicate (verified in this tree) | Contract | Disposition |
|---|---|---|
| `snapshot()` pushes the pre-mutation clone onto `novel.undo_stacks[badge]` (`holonovel/src/core/state.ts:2124-2146`); `novelSnapshot()` supplies `getBadge()` (`core/server.ts:38-41`). | REQ-041a (per-badge keying, full-state snapshot) | keep |
| `undo()` reads and pops only `novel.undo_stacks[badge]` and throws `[STATE_CONFLICT] Nothing to undo.` when that one stack is empty (`state.ts:2148-2161`). | REQ-041a (`an undo in the Player badge reverses the most recent mutation regardless of which badge initiated it`) | **resolve here** |
| `redo()` pops only `novel.redo_stacks[badge]` (`state.ts:2163-2176`). | REQ-116 (per-badge redo stack) | keep (D3) |
| `snapshot()` clears only the caller's redo stack (`state.ts:2145`). | REQ-116 (`Any new mutating tool call clears the redo stack`, read per-badge) | keep (D4) |
| `redo()` pushes the pre-redo clone onto the undo stack without the depth cap and `[snapshot-truncated]` audit that `snapshot()` applies (`state.ts:2168-2169` vs `:2130-2143`). | REQ-041b (depth ceiling) | keep, recorded (D7) |
| Snapshot clones carry `last_mutation_at` (`novelToJSON` at `state.ts:3237`) but no ordering key; that field is the **pre-mutation** stamp, and the first mutation of a fresh Novel carries `null` (`state.ts:1340`). | REQ-041a (newest-first selection) | **add an ordering key** (D1) |
| `manage_history` description says "the most recent state mutation for the calling badge" and "The stack is per badge" (`index.ts:4323`). | REQ-041a; tool-definitions sync | **update** |
| REQ-041a's body says stacks are keyed "by the badge under which the action is invoked", which sits in tension with the next clause of the same sentence. | REQ-041a | **reword** (D5) |
| T10 assertions live in `holonovel/scripts/test-persistence-guardrails.ts:153-168`, `:170-192` (REQ-041b truncation), and `:194-222` (refused-call snapshot); none crosses badges. | REQ-041, REQ-041b | **extend** (T10) |
| The register's 2026-11-12 chunk carries F-P3B1-10 with a stale "Scheduled under `ROADMAP.md` § *Cross-badge undo stack access*" line (`spec/audit/review-register.md:1096-1110`); it sits inside the top-level `## Resolved` section (`:12`) even though the finding is unresolved, and its predicate (`state.ts:2104-2116`) has drifted. | REQ-041a | **resolve in place** |
| Undo/redo stacks are excluded from the state hash (`core/state-hash.ts:16`) and from snapshot clones (`state.ts:3278-3289`); `novelFromJSON` rebuilds a fixed field set and passes stack entries through unchanged (`state.ts:3376-3387`), so an ordering key survives save/load and cannot leak into live state. | REQ-041a, REQ-173a | constraint, not a change |

Count provenance: each `state.ts`/`index.ts`/register line above was read in
this session. Two earlier drafts of this section got the register wrong: one
claimed no row existed (case-sensitive grep), the next claimed the row sat
under `## Scheduled-roadmap` (the only such heading is `:2295`; the row is
under `## Resolved`, `:12`). The cold pass caught both. Consequence:
`check-registers` will **not** force this edit — its ROADMAP cross-check only
applies to findings parsed from a `Scheduled-roadmap` section
(`scripts/lib/register-checks.ts:parseFindings`/`checkReviewFindings`) — so
the register edit is a truthfulness obligation, not a gate dependency.

## 3. Decisions

**D1 — Order snapshots with a stamped sequence, not a clock reading.**
`snapshot()` stamps the clone with `_snapshot_seq = 1 + max(_snapshot_seq)`
across the four undo stacks. Invariant: a new stamp exceeds every snapshot
currently in any stack. Numbers may be recycled after a pop (stacks `[2],[5]`
→ undo pops 5 → next stamp is 3), which is harmless because a popped snapshot
never re-enters an undo stack (it moves to a redo stack and is either restored
by `redo()` — which restamps the *live* state it pushes — or discarded).
Alternatives rejected: ordering by `last_mutation_at` alone (null on a fresh
Novel, equal millisecond timestamps reachable through the in-process
`createEngine()` façade, and it names the pre-mutation state, not the mutation
being undone); a Novel-level persisted counter (new state surface with
§7.7/Appendix M burden); one shared stack (breaks the per-badge depth floor
REQ-041a keeps). The key lives inside the snapshot object only — it is never
copied into live state, is covered by the existing `undo_snapshots`
save-format row ("Array of snapshot objects (per-badge stacks)",
`appendices-reference.md:3299`), and is excluded from the state hash.

**D2 — Undo selects the newest stack head, then pops it.**
The candidate set is the tail of each of the four stacks (tails are newest by
construction). Comparison: `_snapshot_seq` descending, then `last_mutation_at`,
then a fixed badge order with the caller first; a snapshot with no
`_snapshot_seq` (legacy save) sorts below every stamped snapshot, so it can
only be selected when no stamped candidate exists. The pre-undo state is pushed
onto **the caller's** redo stack, so the caller can immediately redo what it
undid.

**D3 — Redo stays caller-scoped.** REQ-116 says the popped snapshot is pushed
onto *a per-badge redo stack*; redo is therefore reached only by the badge that
undid. The roadmap bullet pairs `undo|redo` because they share one tool; the
close condition asserts undo only. Cross-badge redo is recorded as a
non-goal for this increment.

**D4 — Redo clearing stays per-badge.** `snapshot()` clears the caller's redo
stack. REQ-116's sentence is read per-badge, matching the implementation and
the same REQ's per-badge stack sentence. Changing it would expand this
increment into a redo-ownership contract change; record the reading here and
leave behaviour untouched. Cross-badge redo resurrection (A undoes, B mutates,
A redoes over B's mutation) is already reachable before this change and is not
widened by it — the stack contents move the same way, only the *selector*
changes.

**D5 — Reword REQ-041a's keying sentence.** The current body says stacks are
keyed "by the badge under which the action is invoked" and then says "an undo
in the Player badge reverses the most recent mutation regardless of which badge
initiated it". Under the current implementation both clauses cannot hold: a
mutation invoked under the GM lands on the GM stack, so the Player's stack
cannot reach it. The first clause is the terse one; the second is the
normative outcome, and the register already reads it as governing
(`review-register.md:1105-1106`). Replace the first clause with "Stacks are
keyed by the badge under which each mutation was initiated, and an undo
consults the newest snapshot across every badge's stack". The body stays one
paragraph, four sentences, under the 800-character ceiling (current 574,
planned ~615). Collision check, recorded rather than assumed: REQ-041b's "An
empty stack returns `[ERROR] [STATE_CONFLICT]`" is read as *no stack has an
entry* (the sentence follows the restore sentence, not a per-badge pop), and
REQ-041c's "ten snapshot entries" stays a per-badge depth floor. No new REQ.
§5.1 does not feed the contract fingerprint (which hashes §7.7, §5.9, §5.19,
and Appendix Q per `scripts/lib/contract-fingerprint.ts:4-8`), so
`check-fingerprint-sync` is not invalidated; `npm run assemble` still runs.

**D6 — Description is part of the surface.** Update the `manage_history`
description to say undo reaches the most recent mutation under any badge and
that the depth cap is per badge; regenerate `tool-definitions.json` through
`check-tool-definitions-sync` and re-run `tool-definitions-lint`,
`surface-budget`, and `tool-citation-check`.

**D7 — `redo()`'s uncapped undo push is left alone.** `redo()` pushes the
pre-redo clone onto the undo stack without the ceiling or the
`[snapshot-truncated]` audit that `snapshot()` applies. That asymmetry predates
this increment, is not exercised by the close condition, and fixing it changes
when a truncation audit fires; record it here and leave it. Extending the depth
cap to that path would be its own finding if a session shows the stack growing
past the configured ceiling.

**D8 — The register row is corrected in place.** F-P3B1-10 already sits under
`## Resolved` (`review-register.md:12`), inside the *2026-11-12 execution
findings* chunk (`:1096`), and only its "Scheduled under `ROADMAP.md` § …"
line (`:1098`) still points at this section. Edit it in place: retitle the
finding `(Resolved 2026-11-13)`, replace the stale scheduling line with the
resolution sentence, and correct the predicate to `state.ts:2124-2161`. No
section move, and do not claim `check-registers` forces it (it does not — see
§2's provenance note).

## 4. Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/core/state.ts` | stamp `_snapshot_seq`; select newest head across stacks in `undo()`; stamp on `redo()`'s undo push; private helpers + comments | M |
| `holonovel/src/index.ts` | `manage_history` description text only (`:4323`) | S |
| `holonovel/scripts/test-persistence-guardrails.ts` | two T10 assertions (cross-badge + newest-first undo; redo after a cross-badge undo) | M |
| `spec/02-requirements.md` | REQ-041a keying sentence (`:1473`) | S |
| `ROADMAP.md` | remove the *Cross-badge undo stack access* section (`:25-34`) | S |
| `spec/audit/review-register.md` | F-P3B1-10 resolved in place: retitle, replace the stale scheduling line, fix the predicate | S |
| `CHANGELOG.md` | `2026-11-13` entry (topmost dated heading) | S |
| `holonovel/tool-definitions.json` | regenerated | S |
| `spec/audit/req-coverage.md` | regenerated if the freshness check reports drift | S |
| `holonovel.md` | assembled | S |
| `docs/plans/2026-11-13-cross-badge-undo/` | plan, tasks, AAR | S |

Out of scope (named, not done): cross-badge redo (D3); global redo clearing
(D4); any change to `pending_workflow`, checkpoints, or audit preservation.

## 5. Steps

**Phase 0 — probes (before any edit).**
1. Re-run baseline: `npm run status`, `git status --porcelain`,
   `npm run check:fast` (un-piped; expect 41/41 `PASS`).
2. Confirm the four stack keys and load defaults (`state.ts:1292`,
   `:1757-1761`); confirm `novelFromJSON` does not copy unknown keys.
3. Sibling-contract probe: `grep -n "REQ-040d\|REQ-041\|REQ-116\|REQ-129\|REQ-042"`
   over `spec/02-requirements.md`, `spec/04-runtime.md`,
   `docs/engine-contract.md` — record any second binder of
   `manage_history (action: undo|redo)`. Expected: REQ-040d (an undo SHALL
   NOT reverse a badge switch — the badge-switch path must create no
   snapshot), REQ-041a/b/c, REQ-116, REQ-129 (depth), REQ-042 (pending
   workflow); none contradicts D2.
4. Register probe: `grep -n "F-P3B1-10\|Cross-badge" spec/audit/review-register.md`
   — confirm the entry sits under `## Resolved` inside the 2026-11-12 chunk
   with a stale scheduling line, and record the exact lines to edit. Run
   `npm run check-registers` before and after; it must stay clean either way.
5. Create-path probe: read the `manage_novel (action: create)` branch and
   confirm it calls no `novelSnapshot()`. Record the answer; if a create does
   push a snapshot, Phase 3's test drains first.
6. Red probe: add the two T10 assertions, run
   `npm --prefix holonovel run test:persistence-guardrails`, and record the
   failure (current code throws `Nothing to undo.` for the second badge).

**Phase 1 — state.**
7. Add a private `newSnapshotSeq(novel)` (max across the four stacks + 1) and
   `stampSnapshot(clone, seq)`; call from `snapshot()` and from `redo()`'s
   undo-stack push. Keep the clone shape otherwise unchanged.
8. Add a private `newestUndoEntry(novel, caller)` returning
   `{ badge, snapshot } | null` using the D2 comparator; rewrite `undo()` to
   use it and to throw `[STATE_CONFLICT] Nothing to undo.` only when no stack
   has an entry. Leave `redo()` selection per-badge.
9. `npm --prefix holonovel run typecheck` (a snapshot clone is typed as
   `NovelState`, so the key is read through a narrow local type, not `any`
   across the file).

**Phase 2 — surface.**
10. Reword the `manage_history` description (`index.ts:4323`) and REQ-041a
    (`spec/02-requirements.md:1473`), then `npm run assemble`.
11. `npm run check-tool-definitions-sync`; regenerate on drift, then
    `npm run surface-budget -- --write` only if it reports movement,
    `npm run tool-definitions-lint`, `npm run tool-citation-check`.

**Phase 3 — harness.**
12. Add `T10/REQ-041a: undo under a second badge reverses the newest mutation
    made under another badge`. Sequence (each badge switch is recorded as a
    boundary; `set_badge` creates no snapshot, REQ-040d):
    - boot, `manage_novel (action: create)`, `set_badge game_master`;
    - GM: `manage_note (action: set, key: "gm-note", content: "gm-value")`;
    - `set_badge player`; Player: `manage_note (action: set, key:
      "player-note", content: "player-value", badge_scope: "player")` —
      `manage_note` requires only `requireNotObserver()`, so the Player path is
      legal;
    - `set_badge game_master`; `manage_history (action: undo)` →
      `manage_note (action: list)` shows `gm-note` and not `player-note`
      (proves newest-first selection across stacks, not "any foreign stack");
    - `manage_history (action: undo)` → `gm-note` is gone;
    - `set_badge player`; `manage_history (action: undo)` → `[STATE_CONFLICT]`
      (no stack has an entry, not just the caller's).
    Phase 0 records whether the create path leaves a snapshot; if it does, the
    test drains with `undo` until `[STATE_CONFLICT]` before the two note
    mutations, so the final conflict assertion is unconditional.
13. Add `T10/REQ-041a: redo after a cross-badge undo restores from the
    caller's stack`.
14. `npm --prefix holonovel run test:persistence-guardrails`; then the
    harness suite the touch-list requires.

**Phase 4 — close.**
15. Remove the ROADMAP section; correct F-P3B1-10 in place in
    `spec/audit/review-register.md` (retitle `(Resolved 2026-11-13)`, replace
    the stale scheduling line, fix the predicate); add the CHANGELOG entry as
    the topmost `2026-11-13` heading (matching the version surfaces); fill
    `tasks.md` and `aar.md`.
16. `npm run build-order` (assemble + full gate + propagate + typecheck +
    version surfaces) and `npm run validate -- --write-register` if the
    register reports drift; un-piped `npm run check:fast` must end
    `check:fast: PASS`.
17. Commit once (server + harness + spec + roadmap + register + changelog are
    one concern); subject from the CHANGELOG heading.

## 6. Risks and rollback

| Risk | Mitigation |
|---|---|
| Ordering key leaks into live state | `novelFromJSON` rebuilds a fixed field set; assert by round-tripping in the harness (undo then read state, then save/reload the Novel and undo again). |
| A legacy Novel's snapshots have no `_snapshot_seq` | Comparator falls back to `last_mutation_at` — the pre-mutation stamp, monotone within a stack — then badge order; recorded as an upgrade limitation (no data migration). |
| Cross-badge undo violates a badge-gating expectation | The tool already requires only `requireNotObserver()` (`index.ts:4328`); REQ-041a states an undo reverses the newest mutation regardless of initiator. No badge-filtered content crosses the boundary — the restored state is the same Novel the caller could already reach through their badge. |
| Register and roadmap drift apart | D8 corrects F-P3B1-10 in place when the section is deleted, so no register text points at a deleted section; `check-registers` runs in `check:fast` as a net. |
| Depth floor regresses | Untouched: truncation remains per stack in `snapshot()`; the existing T10 truncation assertion (`test-persistence-guardrails.ts:170-192`) stays in the suite. |
| Harness text assertions are brittle | Assert on note visibility (`manage_note (action: list)`) and the documented conflict envelope, both already used by this harness. |
| Regenerated surface drifts (tool definitions, assembled spec) | Phase 2/4 run the sync gates in the documented order before committing. |

Rollback: `git revert` of the single commit. No persisted-format migration is
introduced (the key is additive and ignorable), so an old server reading a new
Novel simply ignores it.

## 7. Verification

- `npm --prefix holonovel run test:persistence-guardrails` — new T10
  assertions pass; existing T10 assertions still pass.
- `npm --prefix holonovel run typecheck` (and root `typecheck`).
- `npm run assemble && npm run check:fast` — 41/41, trailing
  `check:fast: PASS` (un-piped).
- `npm run build-order` — the full gate plus generated-surface sync, with its
  printed `N error(s), M warning(s)` summary.
- `npm run check-registers` — stays clean after the F-P3B1-10 in-place edit.
- Manual spot-check: `manage_history` description in
  `holonovel/tool-definitions.json` matches the source string.

## 8. Commit plan

One commit; the change is a single contract fix across server, harness, spec,
and tracking surfaces. `npm run session:close` derives the subject from the
new CHANGELOG heading. Gate before commit: `npm run check:fast`; gate before
push: `npm run check` (out of scope for this increment — publication is a
separate authorization).

## 9. Amendment A1 — preserve the active badge across undo (REQ-040d)

Added during execution, after the Phase 3 red probe.

**Evidence.** The first cross-badge undo landed correctly (the Player's newer
note was reversed and the GM's note survived), but the harness's GM
`manage_note (action: list)` then returned `[]`. Cause: `applyNovelState`
(`holonovel/src/core/state.ts:3568`) restores every serialized field in `undo`
mode, including `badge`, so the snapshot taken while the Player badge was
active handed the caller the Player badge. That is a direct REQ-040d violation
("`manage_history (action: undo)` SHALL NOT reverse a badge switch") and it
also made the T10 assertion read under the wrong badge.

**Delta.** Add `badge` to the `mode === "undo"` preserve set in
`applyNovelState`. This covers `undo`, `redo` (both call the helper with
`"undo"`), checkpoint restore (`index.ts:4291`), and the pre-workflow restore
(`state.ts:2077`); the import path uses `mode: "replace"` and is unchanged.

**Blast radius.** No new files — the amendment stays inside
`holonovel/src/core/state.ts` and the already-listed harness file. The T10
cross-badge assertion now also asserts the caller's badge after the undo.

**Verification.** `npm --prefix holonovel run test:persistence-guardrails` →
27 passed, 0 failed (both new T10 assertions green).
