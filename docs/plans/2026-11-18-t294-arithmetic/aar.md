# AAR — T294/REQ-274 arithmetic correction and the report-adjudication plan revision

AAR: SUCCESS — the done bar is met: the three T294 copies carry the coherent 0.84 PARTIAL case,
the item-1c plan no longer claims or schedules a T294 inconsistency, `validate` is 0 errors,
`check:fast` is 46/46, and one commit carries the fix, the plan revision, the increment, and the
CHANGELOG.

## 1. What was supposed to happen

`docs/plans/2026-11-18-t294-arithmetic/plan.md` (stamped minimal, light, self) set out to correct
T294's second worked case to match REQ-274, mirror the correction in `holonovel/DECISIONS.md`,
and remove the now-stale T294 branch from the item-1c plan before that plan's own execution. The
done bar required the three copies to agree, the plan to carry no T294 inconsistency, green
`validate`/`check:fast`, one commit, and the pre-existing item-1b revision left untouched.

## 2. What happened

- P1 changed the PARTIAL case from "1 Discrepancy, 2 Pin drifts, 7 matches → 0.84" (which the
  formula scores 0.74, FAIL) to "0 Discrepancies, 2 Pin drifts, 8 matches → 0.84" in
  `spec/appendices-reference.md:1784` and `holonovel/DECISIONS.md:3341-3343`; `npm run assemble`
  propagated it to `holonovel.md` and refreshed `spec/build-phase-map.md`'s content hash.
- P2 removed the T294 inconsistency from the item-1c plan's EV4, D4, D8, D12, blast radius, P4,
  V10, done bar, out-of-scope, and risks; the correction is now a P0(b) precondition with a
  committed AAR. A targeted cold re-review returned one Major (the plan described the correction
  as already committed at the drafting HEAD); it was fixed by the precondition wording. The plan
  was re-stamped fresh at deep depth.
- P3's first `check:fast` failed on `check-g7-attestation` (the spec hash moved); regenerating
  `holonovel/src/generated/g7-attestation.ts` cleared it. The plan's blast radius and V7 were
  extended to name the two generated artifacts, and the minimal stamp was refreshed.
- P3 then ran `npm run validate` (0 errors, 303 warnings) and `npm run check:fast` (46 passed, 0
  failed, `check:fast: PASS`); the evidence was recorded with `mark-build`.

Deviations: the G7 attestation and the build-phase-map hash were not in the plan's first blast
radius; both are mechanical consequences of the spec edit, were added to the plan, and are
recorded here rather than hidden.

## 3. What went right

- The formula check `(8×1.0 + 2×0.2)/10 = 0.84` fixed the example without changing REQ-274, and
  the three copies are byte-consistent.
- The plan revision removes the scheduling branch instead of leaving a fixed defect on the
  roadmap, and the re-review caught the "already committed" tense error before the commit.

## 4. What went wrong

- The first blast radius missed the two generated artifacts that any spec edit touches; the gate
  caught it, but the plan should have named them up front. Disposition: recorded here; the plan
  now names them.

## 5. Gates

| Gate | Token | Verdict |
|---|---|---|
| plan-review (item-1c re-stamp) | `plan-review passed.` | passed, fresh deep |
| plan-review (minimal) | self at light | passed |
| build-review | `build-review passed.` (evidence below) | passed |
| `npm run validate` | 0 errors, 303 warnings | pass |
| `npm run check:fast` | 46 passed, 0 failed | pass |
| `check-g7-attestation` | current | pass |

## 6. Changelog entry

**Title:** T294 arithmetic corrected and the report-adjudication plan revised

**Summary:** T294's PARTIAL case now matches REQ-274's formula, and the item-1c plan drops the
branch that would have scheduled the corrected defect. The G7 attestation and build-phase-map
hash were regenerated; the pre-existing item-1b revision is untouched.

- T294's second case is now 0 Discrepancies + 2 Pin drifts + 8 matches = 0.84 (PARTIAL); the
  source, `DECISIONS.md`, and the assembled spec agree.
- The item-1c plan no longer claims or schedules a T294 inconsistency; the correction is a
  committed P0 precondition, and the plan was re-reviewed and re-stamped.
- `validate` 0 errors, `check:fast` 46/46; no server or spec requirement changed.

LOOP PAUSED
