# AAR — §5.6 typed recap payload remediation

Status: complete
Increment: `docs/plans/2026-11-12-5-6-recap-typed-payload/`
Plan: `plan.md` (stamped `ca64a49d…`, delta-amended in §12)

## Baseline

- `npm run check:fast`: 41 passed, 0 failed, `check:fast: PASS` (draft time,
  clean tree at `6aafcc7`).
- Harness baselines were started before the first edit but overlapped it, so a
  clean pre-change run was obtained a better way: the first red probe stashed
  `holonovel/src/index.ts` and ran the assertions against the unmodified source.
  Pre-existing failures were then confirmed by stashing **all** tracked changes
  and re-running them (`git stash push -u`):
  - `test:memory-recall` → T752/REQ-633 fails on HEAD (`confirmed` vs
    `displaced`); 19 passed, 1 failed.
  - `test:limits` → T740/REQ-096m fails on HEAD (JSON body instead of
    `[STATE_CONFLICT]`); 26 passed, 1 failed.
  - `test:holosuite-novel` → 8 `predicate_unresolved` findings across 7 distinct
    stale anchors, all already wrong at HEAD (`index.ts:9945` is `}`;
    `state.ts:2527` is `if (seedStr)`), so they are stale evidence anchors, not
    recap regressions.
  Both T752/T740 are scheduled in a new ROADMAP section; the anchors fall under
  the existing *Holosuite anchor repoint automation (P2)* item.

## What happened

1. Phase 0 probes: field sources, eleven text-consumer sites, roster audit gap,
   sibling REQ binders, file surface (`core/server.ts:62-63` reads only
   `status`/`category`), death-condition passthrough, audit-length assertions.
2. Implemented `okWith`, `buildRecapPayload`, the four-status rule, the
   confrontation pairing, the scoped/archived/refused `session_id` paths, the
   D2a roster/condition mapping, and three creation audits.
3. Wrote T53 and T212; widened T214 (typed objects, recorded round count) and
   T215 (15 fields), dropping the uncatalogued `T072` and the Manual `T261`
   tokens from the backfill title.
4. Corrected REQ-072c1 ("typed fields"), REQ-175a (round source), REQ-175b
   (empty-array scope) and four Appendix F rows; marked F-P3B1-3 `Resolved`,
   narrowed F-P3B1-9 to seven citations, retitled the roadmap section.
5. Regenerated `tool-definitions.json`, the surface baseline, DECISIONS counts,
   the starter Novel, the coverage register, the embedded spec copies, and the
   contract fingerprints; ran `build-order` to green.

## Red evidence (unmodified source, new assertions)

```
FAIL T53/REQ-072: recap returns the 15 declared fields with typed values:
  REQ-072c1/c2 missing declared field: narrative_orientation
FAIL T212/REQ-072: recap entity status follows HP and the declared death
  condition: Cannot read properties of undefined (reading 'find')
FAIL T214/REQ-175: recap derives completed and pending confrontations:
  REQ-175a expected one completed confrontation object, got undefined
```

Green after the change: `test:output-contracts` **512 passed, 0 failed**;
`test:backfill` green (T215 typed-field assertion).

## What went right

- The structured-result channel avoided the eleven text-consumer breakage the
  design predicted; every consumer stayed green without an edit.
- The paired `rounds_played` evidence was decisive: the fixture's two advances
  over two participants give `ceil(2/2) = 1` by the old formula, while the
  recorded value is 2 — the exact contradiction the plan resolved.
- `check:fast` and `build-order` both end green, with fingerprints regenerated.

## What went wrong

1. **Fingerprint assumption (plan §4).** The draft claimed §5.6 feeds no
   contract fingerprint; `scripts/lib/contract-fingerprint.ts:37` lists it in
   `DATA_SECTIONS`. `check-fingerprint-sync` caught it; the fingerprint was
   regenerated and the plan amended (§12, delta 1).
2. **Creation audits widen Player-visible audit rows.** REQ-168a allows GM-badge
   entries "where the entity affected is owned by the current player", so the
   new `create_character` row is player-visible and T203's blanket "never a
   GM-badge entry" contradicted the REQ. T203 now asserts no *foreign*-entity GM
   entry, citing REQ-168a (delta 2).
3. **T214's fixture named no participants**, so `init_combat` recorded `[]`; the
   assertion now passes ids and advances a full round (delta 3).
4. **The description budget** (1000 B) rejected the first wording (1067 B); the
   sentence was shortened to pass `tool-definitions-lint` and the surface
   baseline/DECISIONS counts were re-recorded.
5. **A resolved finding left in the Scheduled-roadmap section** tripped
   `check-registers` ("cites REQ-072 but ROADMAP has no matching entry"); the
   bullet was removed once its content moved to `## Resolved`.

## Conditions carried from plan-review

- **C-1** — verified: REQ-175a names `rounds_played`, REQ-175b scopes its
  empty-array sentence, `tasks.md` and `plan.md` agree on seven citations,
  eleven suites, and the `opts` parameter (checked by grep below).
- Cold passes: two, both `FAILED` with blockers that were fixed; the final
  re-audit returned `independent-review passed.`. Reports in `cold-review.md`.

## Findings raised during execution

- F-P3B1-3 → `Resolved` (review register, §5.6 typed recap payload).
- F-P3B1-9 → seven citations remain open (T25/T33/T110/T161, T271, T54/T139),
  deferred with F-P3B1-6/-7 on ROADMAP.
- New pre-existing failures T752 (REQ-633) and T740 (REQ-096m) → scheduled on
  ROADMAP as *Pre-existing harness failures: divergence probe and license
  refusal (P1)*.
- Seven stale Holosuite anchors → covered by the existing P2 roadmap item; not
  caused by this increment (verified at HEAD).

## Action items

None open. Both new findings are scheduled, not restated here.

## Verification summary

| Check | Result |
|---|---|
| `npm run check:fast` | 41 passed, 0 failed, trailing PASS |
| `npm run build-order` | complete — assemble, check, propagate, typecheck, versions |
| `test:output-contracts` | 512 passed, 0 failed |
| `test:backfill`, `test:lean-narrator`, `test:workflow`, `test:security`, `test:tool-definitions`, `test:competitive-gaps`, `test:pattern-buffer-ruleset` | all exit 0 |
| Pre-existing (HEAD-confirmed) | `test:memory-recall` T752, `test:limits` T740, `test:holosuite-novel` anchors |

LOOP PAUSED
