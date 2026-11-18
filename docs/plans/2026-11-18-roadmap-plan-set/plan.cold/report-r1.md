# Cold review — revision 1

**Reviewer:** cold pass, stages 1–5 in one session, 47 reads against a 40-read budget (overrun
disclosed; unread claims listed as Unknowns in that report).
**Artifact:** `docs/plans/2026-11-18-roadmap-plan-set/plan.md`, sha256 `414165ac5cdfcc111563c7013b413dac4bc942618fe5099f9b9f6320d092a6ee`.
**Verdict:** `independent-review FAILED.` — 3 Blockers, 7 Majors, 10 Minors.

## Blockers

1. **Artifact identity is ambiguous at dispatch.** The state-store copy at
   `…/plans/fe586f…/plan.md:1` holds a different plan (a §5.6 remediation document, 505 lines) while
   `plan.evidence.json:10-14` names `docs/plans/2026-11-18-roadmap-plan-set/plan.md` with
   `414165ac…`. The gate hash and the reviewed text can diverge. Remedy: stamp the increment plan's
   text; delete or re-point the stale copy.
2. **Item 4's verification table encodes states that cannot pass.** V1 expects "no file above 3,000"
   beside `index.ts ≈17,230`; V6 slices `6527, 7155`, which includes the `resolve_intent` header at
   `index.ts:7155`; and the range is called `6528-7155` (628 lines inclusive) in some places and
   `627 lines` / `--offset -627` in others.
3. **Item 1's done bar spans two sessions in one increment directory.**
   `docs/plans/README.md:35-37` forbids a bar that cannot be reached in one session, and `:55-57`
   ties one AAR to one close.

## Majors

4. **Evidence mis-citations in the parent plan (four).** `KIND_ORDER` is `artifact-registry.ts:54`,
   not `:56`; the install branch is `index.ts:13006`, not `:13001`; the `slug` parameter is optional
   and documented as "a pack without one adopts it" (`:12971`), so "admission requires a slug" is
   false as written; and `computeLenses` does not push every other lane — `wrong_tool` has no push
   site either.
5. **Item 4 misidentifies the register row behind its route.** `review-register.md:3908-3910` is F9
   (mutation sample), open, and belongs to item 2.
6. **Item 2's own numbers do not reach its bar.** 14 + 19 = 33, not 35.
7. **Item 5 closes a register row that does not exist.** No row concerns a codex-pack kind.
8. **The parent's bar requires a "numeric close condition" that two drafts cannot meet.**
9. **Parent V2 invokes `check-loop-artifacts` strictly** while describing it as lenient.
10. **Item 2's expected output is internally impossible in one branch:** a single miss yields
    `catch_rate=0.9714`, not `1`.

## Minors

11. Item 2's done bar and its fallback describe two different remedies for a shortfall.
12. Item 2 deletes `JUDGMENT_GM_LANES` but V4 accepts retaining it.
13. Item 4 presents "five badge/authorization helpers" and "16 or 17 names" as known counts.
14. Item 4's V7 has no expected count; V9 greps for a token the module cannot contain.
15. `wc -l` 17,857 versus `holonovel/AGENTS.md` 17,856.
16. Item 5 says "24 cases" in `test-artifact-registry.ts`; 23 `await test(` sites exist.
17. Item 1 asserts Rule 9's entry is required but never says whether it exists.

## Nits

18. Drafts are numbered 1, 2, 4, 5 with no explanation of the gap.
19. F9 is cited as `:3908-3910` in one file and `:3908-3911` in another.
20. Item 5 cites REQ-321o at `:2317`; the header is `:2316`.
21. Item 4's "627 lines" conflicts with its own range string (covered by Blocker 2).

## Verified on the tree (calibration)

ROADMAP ranges and all four trigger texts exact, none fired; mutation composition 17 / 5 excluded /
12 seeded correct; both judgment lanes unassigned; Wilson numbers correct; the CRUD block's single
out-of-range reference real (`MANAGE_WORLD_SCHEMA` `:6536` read at `:7515`); anchor set exactly 20
with a 7/1/12 partition; kind union sites as described; REQ-620/621 at `:2562/:2564`, T738/T739 at
`appendices-reference.md:2100-2101`, REQ-321o at `:2316`; item 1's REQ citations exact; one
`@section evidence` record; `checkEvidenceRecordContract` exists; `refresh-predicates` supports
`--offset/--path/--from-line/--repath`.

## Unknowns

- Plan sha256 not computed by the reviewer (shell denied); accepted from the sidecar.
- Baseline commands not reproducible read-only: `check:fast` 46/46, mutation 12/12, `status`,
  `wc -l`.
- Item 1's handoff harness absence and the Rule 9 entry were not enumerated by the reviewer.
- `context.ts` field count and the "six of ten" claim were not read.
- The host injected `holonovel/AGENTS.md` into the reviewer's context mid-pass; recorded as a
  context-contamination note.
- `plan.cold/` artifacts were not written by the reviewer (read-only).
