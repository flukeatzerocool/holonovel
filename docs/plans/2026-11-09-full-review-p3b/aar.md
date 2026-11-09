# AAR — full-review sweep, chunk P3b-1 (§5.6 core state and lifecycle)

**Date:** 2026-11-09 · **Scope:** chunk P3b-1 (66 REQs, 19 families), the §5.6
split, register/roadmap/changelog write-back. **Plan:**
`docs/plans/2026-11-09-full-review-p3b/plan.md` (sha256 `d44e7a4b…`, stamped
fresh, standard depth).

## What happened

1. Baseline measured: tree clean at `cfaad6b`, `check:fast` 37/37 PASS,
   `check` PASS, nine server harnesses green (338 output-contract assertions
   among them). No C0 was needed.
2. §5.6 was split per Q1/D12 into four family-atomic chunks; P3b-1 executed.
   `REQ-073`'s five parts stayed whole despite straddling two §5.6 heading
   blocks.
3. All 66 P3b-1 REQs were reviewed against the code and their citations:
   **59 holds, 7 finding rows carrying 9 findings** (2 P0, 7 P1).
4. Both P0s were fixed in-session with widened assertions:
   - F-P3B1-1: `audit://novel` now renders the full chained log as Markdown,
     badge-filtered, with the no-Novel `[STATE_CONFLICT]`; the
     `withForbiddenAudit` wrapper records `getBadge()` (it previously stored an
     undefined context badge). T203 was widened; two JSON-parsing harnesses were
     updated.
   - F-P3B1-2: the combat-init guard and the navigation block now name
     `manage_combat (action: end)` instead of the nonexistent `end_combat`.
5. Seven P1 findings were scheduled under a new ROADMAP section, *§5.6 core
   state and lifecycle remediation (P1)*: structured recap, condition Player
   access/audit, audit coverage gaps, countdown clock types, combat turn report,
   vow lifecycle, and a citation-repair set.
6. Worklist P3b-1 section (66-row table + cluster verdicts), register rows
   (`Resolved` and `Scheduled-roadmap`), roadmap re-scope, and the changelog
   entry landed.

## What went right

- The per-REQ table separated 59 genuine holds from the 7 rows carrying findings;
  the two P0s were small, bounded fixes once the predicate was read.
- The cold plan review caught a real arithmetic error in the split (P3b-4 = 67,
  not 65) before execution, so the worklist and roadmap agree.
- Reading T203/T214/T258 exposed the narrow-assertion class this sweep exists to
  find: each P1 rests on a harness that asserted a substring, not the contract.

## What went wrong

- The first audit-resource implementation dropped audit args, which broke T532's
  creator/attribution assertion; including the args column restored it.
- The Player badge filter initially excluded the boundary entry because
  `withForbiddenAudit` was writing `ctx.badge` (undefined through the MCP call
  path). The widened T203 assertion exposed it and the wrapper was corrected.
- Fixing the resource surfaced a tests-coupling truth: two harnesses parsed the
  old JSON shape. Both were migrated to line assertions.

## Action items

None open beyond the scheduled roadmap section. The remaining P3b-2/P3b-3/P3b-4
chunks are scheduled on ROADMAP.md; the remediation findings are `Scheduled-roadmap`
in the review register.

LOOP PAUSED
