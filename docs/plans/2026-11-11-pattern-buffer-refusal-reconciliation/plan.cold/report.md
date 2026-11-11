# Cold pass report — pattern-buffer verb-refusal reconciliation

Reviewer: cold-pass synthesis (stages 1–5, fresh contexts)
Plan sha256: 02e3782e2fd77cbbb1341e380776b67084deba87a77bc62a3076bdf365566372
Plan sha256 reviewed by stages 1–5: ab78c822488c2d760da51204ad2bb99c6b68f918814c050db65e0f7d65f3afd1
Gate depth: standard
Stages run: 5/5 (stage 4 re-zoom ran once; no stage failed twice)
Dispatch budget used: 7/7 (stage 1, stage 2, stage 3 design/structural/style, stage 4, stage 5)
Tree: c424a87

## Verdict

`independent-review passed.` with one residual condition (C-cold). The single
clarity Blocker (an unsatisfiable §6 verification command) and the Majors were
fixed by targeted edits after stage 4/5; those specific amended lines were not
re-read by a fresh context because the dispatch cap was reached.

## Stage outcomes

| Stage | Reviewer | Verdict | Blocker | Major | Nit |
|---|---|---|---|---|---|
| 1 zoom out | cold-stage1 | findings returned | 0 | 3 | 6 |
| 2 comprehension | cold-stage2 | faithful | 0 | 0 | 0 |
| 3 design | cold-stage3-design | findings returned | 1 | 3 | 4 |
| 3 structural | cold-stage3-structural | findings returned | 0 | 2 | 5 |
| 3 style | cold-stage3-style | findings returned | 1 | 3 | 8 |
| 4 re-zoom | cold-stage4 | not passable | 1 | 3 | 8 |
| 5 readiness | cold-stage5 | READY | 0 | 4 | 4 |

## Findings and resolutions

1. **Blocker (clarity, stage 4) — §6 block grep could match only one of the two
   new lines, and "no stale text" was not line-scoped.** Resolved: §6 now has
   three line-scoped greps over `sed -n '860,880p'` with expected counts
   1 / 1 / 0, matching done bar 1.
2. **Blocker (style, stage 3) — "replace the two lines" undercounted the
   three-physical-line block.** Resolved: done bar 1 and Phase 2 name
   `:865-867`, preserve `:864`, and specify two logical lines in the
   `take lever` format.
3. **Blocker (design, stage 3) — the Phase 1 probe omitted Novel creation and
   the character/active-entity step, so it could not reach the refusal.**
   Resolved: Phase 1 now names Novel creation, the W.1 block
   (`:788-808`), character create + `set_active`, Player badge, a ruleset-free
   run, and the `createEngine` / `call` harness options.
4. **Major — badge contradiction disposition (REQ-196a).** Resolved as a
   scheduled P1: ROADMAP section `§5.10 REQ-196a Player-badge clause` plus
   register row F-P6a-19; done bars 5–6 name both.
5. **Major — `LOOP PAUSED` unachievable with publication out of scope.**
   Resolved: done bar 9 requires the AAR to record
   `deployed: not applicable — no publication in scope`.
6. **Major — `spec/build-phase-map.md` misclassified as fully generated.**
   Resolved: blast radius says only its content-hash line is rewritten by
   `assemble` (REQ-278).
7. **Major — transcript line not re-derivable from a throwaway probe.**
   Resolved: done bar 9 requires the probe body and captured output in the
   AAR.
8. **Major — done bar 1 had no post-edit verification.** Resolved by the three
   §6 block greps.
9. **Major — citation drift** (`ROADMAP.md:15-23` → `15-24`;
   `appendices-fixtures.md:864-867` → `865-867`; `02-requirements.md:3248-3251`
   → `3248-3252`; `parser.ts:123` → `124`). Resolved in the final text.
10. **Major — register-row and ROADMAP-section substance left to the
    implementer.** Resolved: done bars 5–6 specify the bullet, heading, and
    `Scheduled under § §5.10 …` clause.
11. **Nit — placeholder notation drift, literal "six checks", conditional in
    the done bar, "zero behavioural change" vs the changed surfaces,
    unrooted cold-pass path, missing line anchor on the `index.ts` bullet,
    CHANGELOG heading ellipsis, size-column legend, and the T239 badge
    attribution.** Resolved in the final text.
12. **Nit — T239 does not itself run under the Player badge.** Corrected in
    the final text: the Player clause is Appendix F's; the harness runs under
    Game Master (`test-backfill.ts:389`).

## Residual condition

- **C-cold** — the post-review amendments listed above (done bars 1, 5, 6, 9,
  §2 evidence bullets, Phase 1, Phase 4, §6 rows) were applied after the last
  cold dispatch and were verified only by the author's self pass. `build-review`
  step 0 must diff-read those paragraphs before the first edit.

## Unknowns (not resolved cold)

- The probe's actual nearest-verb list for the W.1 fixture under the Player
  badge (Phase 1 records it; the document deliberately does not pin values it
  has not observed).
- Whether `check-registers` imposes a stricter schema on dated group headings
  than the sibling rows demonstrate.
- `test:all`'s exact pre-change suite list (recorded in Phase 0, not asserted
  green).
