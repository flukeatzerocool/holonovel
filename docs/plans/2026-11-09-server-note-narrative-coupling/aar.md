# AAR — server-note narrative coupling (REQ-365a/b/c, F-P8-1)

**Status:** complete · **Date:** 2026-11-09
**Plan:** `docs/plans/2026-11-09-server-note-narrative-coupling/plan.md`
**Roadmap item:** § Server-note narrative coupling (P1) — retired by this
increment

## What shipped

1. `badge_briefing` emits a `### Server guidance` section for server notes
   carrying a `narrative_tag`, rendered `- [lore-seed] <content>` in note-key
   order with underscores turned into hyphens. The gate is
   `badge === "game_master" || badge === "none"` — the same admission as the
   `server-notes://` resource — so the Player and observer badges never see a
   server note. Untagged notes stay resource-only, and the section is omitted
   when nothing is tagged, leaving REQ-265b's no-empty-`Synthesis` rule intact.
   (`holonovel/src/index.ts:14101` predicate, `:14107` render; REQ-365a/b/c)
2. T416 widens from set/list to the briefing surface: four tag values, the
   empty-body guard, untagged omission on the GM badge, and Player absence,
   with cleanup for all six fixture notes.
3. F-P8-1 is `Resolved` in the review register with its predicate and
   exercising harness; the ROADMAP section retired; DECISIONS.md records the
   placement decision (D1–D2 in the new `### Briefing section placement`
   section).

## Evidence

| Step | Command | Result |
|---|---|---|
| C1 typecheck | `cd holonovel && npx tsc --noEmit` | exit 0 |
| C2 harness | `cd holonovel && npm run test:backfill` | 78 passed, 0 failed; `PASS T334/T416/T285` |
| C2 load-bearing check | revert C1 via `git stash`, rerun T416 | `FAIL … expected to contain "[lore-seed] The old gods were banished"`, 77 passed / 1 failed; stash popped |
| C7 register | `npm run validate -- --write-register` | 0 errors; register re-written byte-identical (REQ-365 already named T416) |
| C8 / gates | `npm run check:fast` | see below |

The 280-warning total and the `proofread register records 271 warnings; live
run produced 276` notice are pre-existing: the same validate run with this
increment's review-register edit stashed produced the identical counts.

## What went right

- The cold pass caught a design defect before any edit: rendering into the
  `### Synthesis` "Supplementary guidance" group would have produced a
  synthesis section with zero synthesis items on a ruleset-free Novel
  (REQ-265b) and would have lost its label exactly when needed
  (`renderItems` returns before emitting the label when the list is empty). The
  sibling-section design removed that whole class.
- The diff re-review caught two propagated inconsistencies (C3 still named the
  old predicate; a story-journal citation claimed a guard that does not exist).
  Both were fixed before the first edit.
- The load-bearing probe (stash, rerun, pop) proved the widened assertion
  actually depends on the new code — the false-green class this repo watches
  for.

## What went wrong

- The first draft of C1 was under-specified ("implementer's choice"), which is
  what let the two contradictory orderings survive into the plan. Fixed by the
  cold pass; the lesson is to write the exact emission shape at plan time.
- `shasum` is not installed on this host; `sha256sum` is. No impact.

## Findings and dispositions

- **N-1 (P3, closed).** The `proofread-register` recorded count (271) trails the
  live proofread total (276). It is advisory only and predates this increment;
  refreshing it is a documentation chore, not a defect. Closed, no action.
- **N-2 (P3, closed).** `campaign_bible` and the empty-body guard were listed as
  untested notes by the re-review; both are now asserted in T416. The binding
  verification then showed the `- []` assertion did not actually fence the
  empty-content note (a failed filter renders `- [lore-seed] `, not `- []`), so
  T416 also asserts `- [lore-seed] \n` and `undefined` are absent.
- **N-3 (P3, closed).** Note ordering used `localeCompare`, which is
  locale-dependent and therefore not host-independent; it now uses a codepoint
  comparator so the briefing bytes are identical on every host (D5).
- No new P0/P1/P2 findings. The remaining roadmap (21 items) is unchanged apart
  from the retired entry.

## Recommendation

None outstanding. The next increment comes from `ROADMAP.md` (§5.2/§5.8
assertion repair is the new top P1) or a direct user request.

LOOP PAUSED
