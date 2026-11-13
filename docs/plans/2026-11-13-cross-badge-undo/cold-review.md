# Cold review — cross-badge undo stack access

Plan sha256: dc596e79a4c9722eb7fa7ed0aa496396e32523dcb9cf47a57fe94b97f250fbd5

Two cold passes, both in fresh reviewer contexts. Pass A reviewed the whole
plan; Pass B was the diff re-review of the revised plan.

## Pass A — full cold review

Reviewer: review subagent (fresh context), standard depth · reads 21/40 ·
stages 5/5 · verdict `independent-review FAILED.`

### Blocker

**B1 — the register claim was false.** The plan asserted the register held no
finding row for the section. In fact `spec/audit/review-register.md:1096-1110`
carries F-P3B1-10 ("undo cannot reach another badge's mutation"), citing
REQ-041a and a drifted predicate. Consequences: the register was missing from
the blast radius; the ROADMAP deletion would leave a stale scheduling line;
the work was under-scoped (F-P3B1-10 must be marked resolved).

### Major

- **M1** — D5's "contradiction" was asserted, not argued, and the collision
  with REQ-041b ("An empty stack returns `[ERROR] [STATE_CONFLICT]`") and
  REQ-041c (per-badge depth) was unaddressed.
- **M2** — Phase 3's cross-badge test had no initial badge and an ambiguous
  undo caller; not executable as written.
- **M3** — the sibling-contract probe omitted REQ-040d (an undo SHALL NOT
  reverse a badge switch).
- **M4** — `_snapshot_seq` monotonicity was only local; the invariant was
  unstated.

### Minor

- m1 — `redo()`'s undo-stack push has no depth cap or truncation audit.
- m2 — blast radius omitted the register.
- m3 — `last_mutation_at` is the pre-mutation stamp, described inaccurately.
- m4 — cross-badge redo resurrection already existed; the risk table implied
  the boundary was fully analysed.

### Nits

CHANGELOG heading must be topmost; the T10 line range must include the
REQ-041b truncation test (`:170-192`); the register predicate must be corrected
when resolved.

## Pass B — diff re-review

Reviewer: review subagent (fresh context) · budget 10 reads · verdict
`independent-review FAILED.`

Per-finding verdicts: M1, M2, M3, M4, m1, m3, m4, and the nits **Resolved**.
B1 **not resolved** on its premise: F-P3B1-10 sits under `## Resolved`
(`:12`), not `## Scheduled-roadmap` (the only such heading is `:2295`), and
`check-registers` cross-checks only findings parsed from a Scheduled-roadmap
section, so the plan's "the gate forces the move" mechanism was wrong.

Remaining Major in changed lines: D8 / the §2 row / Phase 4 step 15 rest on the
wrong register structure and omitted the one edit that matters — the stale
"Scheduled under …" line at `:1098`. The reviewer's fixes: correct the
predicate in place, retitle the finding, replace `:1098`, and drop the
`check-registers` claim.

## Parent disposition after Pass B

The remaining Major is a factual correction, verified in this run by reading
`spec/audit/review-register.md:1-20`, `:1096-1110`, and
`scripts/lib/register-checks.ts` (`parseFindings`, `checkReviewFindings`).
Applied in the revised plan: §2 row and provenance note, done bar, D8, Phase 0
step 4, Phase 4 step 15, blast radius, risk table, and §7 now state the
in-place edit and explicitly disclaim the gate dependency. The D2 legacy-order
nit was also applied. This pass is the standard-depth cap (one re-review); the
corrected text is left to `build-review` to verify against the register at
execution time rather than spending a third cold pass.

## Pass C — targeted re-audit of the corrected register passage

Reviewer: review subagent (fresh context) · 5 reads · verdict
`independent-review passed.`

Verified: F-P3B1-10 sits under `## Resolved` (`:12`) in the 2026-11-12 chunk
(`:1096`), with the stale scheduling line at `:1098` and a drifted predicate
(`:1103` cites `state.ts:2104-2116`); the correction is in place, not a move;
`check-registers` cross-checks ROADMAP only for findings parsed from a
Scheduled-roadmap section (`scripts/lib/register-checks.ts`, `parseFindings`
and `checkReviewFindings`), so it does not force the edit. The done bar, §2
provenance note, D8, Phase 0 step 4, Phase 4 step 15, and §7 all state that
consistently. One clarity nit (the §2 row gives the chunk range `:1096-1110`
where D8 pins `:1098`) — not a contradiction, not actioned.

## Pass D — targeted audit of execution delta A1

Reviewer: review subagent (fresh context) · 5 reads · verdict
`independent-review passed.`

Verified: `applyNovelState` now preserves `badge` only for `mode === "undo"`
(`state.ts:3573-3586`), `replace` still overwrites; all five call sites match
the amendment (pre-workflow restore `state.ts:2077`, undo `:2216`, redo
`:2232`, checkpoint restore `index.ts:4291`, import `index.ts:13000` with
`"replace"`); REQ-040d says what the amendment quotes; no file outside the
blast-radius table changed. Two nits, not actioned: checkpoint restore and
pre-workflow restore are now badge-preserving without their own assertion, and
the §4 `state.ts` row does not name the badge-preserve change (recorded in §9
only).
