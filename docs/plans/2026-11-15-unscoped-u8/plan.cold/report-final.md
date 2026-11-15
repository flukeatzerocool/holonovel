# Independent Review — U8 plan, verification of the delta fixes

Reviewer: review subagent (cold; final targeted verification pass)
Plan reviewed: `plans/2026-11-15-unscoped-u8.cold/plan.v1.3.md`
sha256 `cfecdf5ea876e524314930a589cbd540299138df48c1025be6f4645a913ebe14`
Diff: `plan.v1.2-to-v1.3.diff` (119 lines) · reads 5/6

Scope: confirm D1–D6 from `report.md` are applied, and check only for defects
those six edits introduced. Not a new full review.

## Verdict per finding

| ID | Result | Evidence |
|---|---|---|
| D1 | Resolved | V6b accepts 5 when the R35 section is added; 6.5's branch requires 1–3 bullets and a `**Trigger:**`; count arithmetic confirmed against `ROADMAP.md:15,35,50,62,72` and the admission rule at `:4-6`. |
| D2 | Resolved | `holonovel/src/generated/g7-attestation.ts` is in the Generated row with the note that V7 does not cover it; the Unchanged row drops it and drops the now-irrelevant V12 citation. |
| D3 | Resolved | The trigger clause is present and 6.6 enforces the same shape over every remaining section. |
| D4 | Resolved | 6.3b and done bar 4 carry no literal count; only V2's expected column names 45, as provenance. |
| D5 | Resolved | 6.5b conditions on 6.2 not having already re-pointed the bullet. |
| D6 | Resolved | R4's narrative matches 6.5b's operative text. |

## Nits (non-gating)

- **N1 [clarity] — the added section's placement was unstated.** "Add its
  section here" would have displaced the synthesis heading. The parent applied
  the reviewer's clause before stamping: the section goes after the three
  remaining sections and before `## Non-goals`.
- **N2 [clarity] — R7's replacement sentence overclaims in the other
  direction.** EV2 and the Phase 0 step still name 45; only the pass criteria
  matter, and they are correct.
- **N3 [clarity] — the attribution to V13 understates coverage.** V12's
  `check-g7-attestation` is the freshness gate; V13 only confirms the file is an
  intended change.
- **N4 [clarity] — one paragraph exceeds 120 columns.**

## Unknowns

- `generate-g7-attestation.ts`'s write set was accepted from D2's premise, not
  re-verified (outside the delta scope).
- This pass checked the six items against their stated summaries, not against
  `report.md`'s per-finding prose.

No Blocker and no unaddressed Major. The plan is safe to execute as written.

independent-review passed.

## Binding

Plan sha256: dc17da65da6cd6a09d9362188987c9d8fc2afe8eadc3bd4715372f5a17d4215d

That plan file is v1.3 plus the
one-clause N1 placement amendment applied after this verification pass. The
amendment changes no gate, target, row, or command; it states where a new
`ROADMAP.md` section goes.
