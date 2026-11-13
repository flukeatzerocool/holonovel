Reviewer: DeepSeek V4.1 Flash 1017 (cold pass, stages 1–4; delta re-review,
one round; binding update only)
Plan sha256: b677a29f5f12a81a1013c23e83a2e0fbd7c965de49e1926a8191e86e31fbb8a0

# Cold review — pre-existing harness failures: divergence probe and license refusal

Date: 2026-11-12
Artifact: `docs/plans/2026-11-12-harness-failure-remediation/plan.md`
Repository root: `/home/fluke/Holonovel`, HEAD `e4e4fa0`
Scope: stages 1–4 (standard depth), then one delta re-review of the five Majors.

This file is the single cold artifact. It records the first pass, the delta
re-review, and the findings that remain open. Stage 5 readiness was not run.

## Binding note

The `Plan sha256` header binds the artifact as re-bound on 2026-11-12, after the
author applied this review's M-6 and M-7 corrections (H-2 warning attribution
corrected; the mixed-polarity gap moved to Section 8) together with the numeric
and citation minors.

Under the standard re-review cap no third pass was run. Those post-delta
corrections are **not** re-reviewed in this file; they are recorded as stamp
condition **C-2**, and `build-review` verifies them against the live tree at
build time. The findings, severity tally, and verdict below are unchanged from
the delta re-review; the artifact hashes bound by the first pass
(`2e51a4f6…def6c`) and the delta pass (`e2b2c728…05362`) were reviewed.

## Verdict

Executable as written once the two Majors below are corrected. No Blocker. All
five findings from the first pass are resolved; two of the fixes introduced or
left narrow defects (M-6, M-7), each a one- or two-sentence correction, not a
design reversal. Both fix designs (D1, D3) remain feasible at the predicates
they name. The M-6/M-7 corrections are accepted on the author's report and
carried by condition C-2, not re-reviewed here.

## Delta re-review — the five prior Majors

| Prior finding | Resolution in the new artifact | Verdict |
|---|---|---|
| **M-1** D1 narrowed `opposite` without contract coverage and contradicted CR-3 | D1 (`plan.md:56-80`) now defines *event-anchored* (anchor non-null) and the *anchored subset*, applies both `samePolarity` and `opposite` to that subset when the record cites an ordinal and the subset is non-empty, keeps CR-3 as an ordering rule among the considered facts, records the rejected unrestricted-`opposite` alternative with its failure mode, and assigns the mixed case a behavior. D2's O.13 line drops "same claim" (`:86-88`). | **Resolved.** Residual minor: the register entry CR-3 (`spec/audit/review-register.md:1136-1138`) is still unqualified and D6 (`plan.md:118-122`) does not annotate it (N-1). |
| **M-2** "the anchored subset" ambiguous | `plan.md:57-63` defines it and names the failing reading explicitly ("never over facts anchored to the cited ordinal alone (that reading yields an empty set and fails the probe)"). | **Resolved.** |
| **M-3** generated-only claim false, change unlisted | `plan.md:97-103` states the `export_license_unattributed` entry disappears, why, and that no assertion depends on it. The grep claim is accurate: `license-unattributed` appears only in the T740 unattributed case (`holonovel/scripts/test-limits.ts:286`) and unrelated ruleset-vendor checks (`test-competitive-gaps.ts:388`, `src/rulesets.ts:410-412`). | **Resolved.** Introduced one contradiction: N-9. |
| **M-4** done-bar counts wrong | `plan.md:131-134` now reads 20/20 and 27/27, matching §7 (`:181-182`). | **Resolved numerically.** The parenthetical is wrong: N-10. |
| **M-5** AAR never rewritten | Step 8 (`plan.md:156-157`) requires replacing the skeleton and forbids shipping the 19/1 and 26/1 counts. `aar.md` and `tasks.md` exist, so the increment contract holds. | **Resolved.** Residual: §6 Files still omits them (N-11). |

Stage-4 patch check: the fixes are internally consistent except for N-9 (D3 vs
§8) and the two new Majors below. No fix merely reworded its finding.

### M-1 — resolution evidence worth keeping

The new D1 matches the live predicate. `anchorMismatch` is
`record.event_ordinal !== null && f.anchor !== null && f.anchor !== record.event_ordinal`
(`holonovel/src/core/divergence.ts:360-361`), `confirmed` returns at `:379`,
`false_outcome` at `:384-392`, `displaced` at `:394-401`. The fixture supplies a
positive anchored fact at ordinal 1 (event text `test-memory-recall.ts:303`; no
`gave` cue in `OUTCOME_CUES`, `divergence.ts:90-107`) and an unanchored
`campaign:threads` restatement (`index.ts:1091`, projected with `anchor: null` at
`divergence.ts:299-300`), so D1 as written yields `displaced` with a non-null
`truth.anchor` at ordinal 1 — which is what D5's new assertion
(`plan.md:111-114`) requires. The mixed case D1 now assigns to `false_outcome`
(`plan.md:77-80`) is correct: an anchored opposite fact at the cited ordinal is
reached by `opposite` before the `displaced` fallback.

## New findings

### Major

**M-6 [design] H-2's audit-slug sentence is false, and the T740 slug assertion
cannot be red-first as step 3 claims.** `plan.md:44` says the unattributed branch
audits "`generated`, not the loaded module". The audit passes
`{ slug: embedded.slug }` (`holonovel/src/index.ts:12693`), and in the generated
branch `embedded.slug` is `novel.adventure_slug ?? "generated"`
(`index.ts:12366`). `manage_adventure (action: load)` sets `novel.adventure_slug
= slug` (`index.ts:12006` case, `:12075`) and never clears `generated_adventure`
(`:12077-12082` re-applies its world section). In the T740 block the Novel is
generated at `test-limits.ts:242` and then loads `unlicensed` at `:283`, so the
audit entry already names `unlicensed`, not `generated`. Consequences: (a) H-2's
parenthetical is wrong and should read "the embedded slug, which is the loaded
slug whenever one is set, `generated` otherwise"; (b) `plan.md:148-149` requires
confirming that each added assertion "fails on HEAD behaviour", but the D5
T740 assertion (`:114-116`) passes on HEAD — it is a regression pin, not a red
assertion; (c) `plan.md:43-45` is now internally inconsistent, since H-3 asserts
that the both-active manifest "still names `novel.adventure_slug`" while H-2
asserts the same field is `generated`. Fix the prose and restate step 3 as "the
T752 anchor assertion and the T740 refusal test fail on HEAD; the T740 slug
assertion is a pin". The core H-2 predicate is unaffected: provenance is `null`
for the generated branch (`index.ts:12366`), so the license gate never refuses.

**M-7 [clarity] D1 asserts a soft-flag record that does not exist.**
`plan.md:79-80` says "that gap is listed as a soft flag", but no such list
appears anywhere in the artifact (the only occurrence of "soft flag" is that
sentence). The §8 mitigation still rests on "the fixture covers all six
verdicts" (`plan.md:190-192`), which does not reach the mixed-polarity case.
Either add the gap to §8 and to the D6 register entry as a P3 observation, or
drop the claim and say plainly that the mixed case is unprobed.

### Minor

- **N-1** CR-3 (`spec/audit/review-register.md:1136-1138`) still states the
  precedence unqualified and cites T749 as coverage; D6 (`plan.md:118-122`) does
  not annotate that D1 narrows the considered fact set. Add one clause to the new
  register entry.
- **N-2** `plan.md:43` cites `divergence.ts:357-358` for `anchorMismatch`; it is
  `:360-361`. `plan.md:45` cites `:12725` for `adventure_module_slugs`; it is
  `:12724` (unchanged from the first pass).
- **N-3** `plan.md:73-74` still says conflated resolves to "anchored event 2".
  The conflated branch returns `samePredicateObject[0]`
  (`divergence.ts:404-411`), which is the `Anna outcome Kael` fact at anchor 1
  (event-1 pair expansion, `:179-192`).
- **N-4** O.13 is a table plus a paragraph (`appendices-reference.md:3192-3205`).
  `plan.md:86` ("one line after the whole-word sentence"), `:5` ("one appendix
  table row") and `:169` ("one O.13 precedence line") describe three forms; pick
  one and, if a row, its Contract label.
- **N-5** D5 (`plan.md:114-116`) pins the audit slug on a share whose embedded
  body is generated (`index.ts:12364`, `:12734`), encoding the H-3 inconsistency
  as expected behavior. Add a comment tying it to H-3 or defer the slug assertion.
- **N-9** §8 (`plan.md:195`) says "the generated-only path and the unattributed
  path keep their behaviour", contradicting D3's new statement that generated-only
  shares stop emitting the audit entry (`:97-103`). Scope the §8 sentence to
  refusal behavior.
- **N-10** The done-bar parenthetical (`plan.md:132-134`) says the added
  assertions "live inside existing `test()` blocks, so the totals rise by one
  each". Those clauses contradict each other: inside an existing block the total
  does not move; the 20 and 27 figures are today's totals (19 pass + 1 fail,
  26 pass + 1 fail), which the fix converts to 20/20 and 27/27.
- **N-11** §6 Files (`plan.md:163-172`) still omits `aar.md` (rewritten by step 8)
  and `tasks.md`, both of which exist and belong to the increment contract.
- **N-12** Baseline (`plan.md:25`) records `git status --short: clean`; the
  increment directory is untracked (preflight sidecar). `plan.md:138-139`
  attributes `test:holosuite-novel` stale anchors to "the same roadmap text",
  but `ROADMAP.md:15-24` names only T752/T740; the anchors item is elsewhere
  (`ROADMAP.md:176-177`).
- **N-13** D6 (`plan.md:119`) says "add a `## Resolved` entry"; register entries
  are `### <date> <title>` subsections under `## Resolved`
  (`review-register.md:12-14`).
- **N-14** D1 moves the affect-drift check (`divergence.ts:365-379`) onto the
  anchored subset, so an anchored outcome fact can now yield `affect_drift` where
  the old code returned `confirmed`. No fixture covers that combination; it
  belongs beside M-7's mixed-case note.

## Claims re-verified in this pass

| Claim | Result |
|---|---|
| `case "load"` sets `adventure_slug` and keeps `generated_adventure` | Confirmed, `index.ts:12006`, `:12075`, `:12077-12082`; no `generated_adventure = null` remains |
| Generated branch's `slug` is `adventure_slug ?? "generated"` | Confirmed, `index.ts:12366` |
| Audit carries `embedded.slug` | Confirmed, `index.ts:12693` |
| No assertion depends on the generated-only audit entry | Confirmed by grep (only `test-limits.ts:286` and ruleset-vendor checks) |
| Verification commands exist | Confirmed earlier, `holonovel/package.json:82,84,85,103` |
| Increment carries `plan.md`, `tasks.md`, `aar.md` | Confirmed by directory listing; `aar.md:13-16` still holds the pre-fix counts |

## Unknowns

- No gate or harness was executed in either pass (read-only; gates need a
  writable tree). Baseline counts rest on the plan and `aar.md:12-16`.
- `64 unpushed commits` (`plan.md:25`) was not checked.
- Whether `manage_adventure (action: generate)` sets `adventure_slug` to
  `"generated"` was not checked; it does not affect M-6, since `load` overwrites
  the field and either value is named correctly in D3.
- `test-belief.ts` was not read; T779's question set is unanchored
  (`test-memory-recall.ts:764-782`), so D1 leaves it alone.
- The REQ headroom figures (`plan.md:82-83`, 765/800 and 797/800) were not
  measured.

## Reads used

First pass: 41 read/grep/glob calls (standard cap 40; the overrun was the
increment-directory listing and `aar.md`). Delta re-review: 4 read/grep calls
plus two shell invocations. Binding update: hash check only, no review reads. No
target file was edited.

independent-review passed.
