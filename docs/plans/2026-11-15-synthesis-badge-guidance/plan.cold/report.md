# Independent cold review — badge guidance renderers (U6-F6)

Plan sha256: aac3d58cbcbd29199fa06a499d29988c6b91fcd53681c566edc100c151c154a8
Reviewer: independent-review (fresh context, no authoring history), dispatched by
plan-review at standard depth.
Artifact reviewed: `plan.md` v1 (sha256 `04f9f2a6a60796fc6594e10eff93fad902a7bb5ab4444c1b32ca6af56d5871b9`)
and v2 (sha256 `b8b882bc3e409630b8cb02418eeccf4df1a44222dcd78d7972144830bcbc8508`).
Repo HEAD at dispatch: `822228f`. Shell was denied inside the reviewer's context, so hashes,
HEAD and the fast-gate result were taken from the dispatch envelope and are recorded as
reviewer Unknowns, not as verified facts.

## Pass 1 — full review of v1

Verdict: `independent-review FAILED. [plan.md] — 3 blockers`.
Reads: 67 (budget 40; overrun because the dispatch required resolving EV1–EV20 plus five
repo checks).

| # | Severity | Finding | Predicate |
|---|---|---|---|
| B1 | Blocker | Phase 4 assert 2 could not pass on a default `boot()`: `wisdomManifest` is `null` until synthesis runs, and `effectiveWisdomItems` returns `[]` on a null manifest, so both voice views would render the empty marker | plan.md v1:237-239, :135-137 · `holonovel/src/core/state.ts:1232` · `holonovel/src/index.ts:16191-16192` |
| B2 | Blocker | Task 37 ran `check:fast` while the increment directory lacked `aar.md`, which `check-loop-artifacts` gates | tasks.md v1:79 · `docs/plans/README.md:23,26-27` |
| B3 | Blocker | The tone payload stripped `[narrative-tone]` while assert 1 and REQ-071a require the tag in the rendered resource | plan.md v1:187-189 vs :234-236 · `spec/02-requirements.md:226` |
| M1 | Major | V5's `[LOW]` assertion was unachievable: no harness helper seeds a wisdom item; shipped voice profiles are HIGH and GM-scoped | plan.md v1:240-251 · `holonovel/scripts/test-output-contracts.ts:114,137,171` · `holonovel/src/core/wisdom.ts:323-344` |
| M2 | Major | REQ-022a's resource catalogue omits `voice`, and REQ-022b requires every required URI to be listed | `spec/02-requirements.md:696,707` |
| M3 | Major | "Restricting to the badge named in the URI" was undefined and collided with a global-badge filter | plan.md v1:131-138 · `holonovel/src/index.ts:16285-16288` |
| M4 | Major | §11.3 says Ruleset Wisdom is always present, but the voice view was built only from the manifest | `spec/08-synthesis.md:277-279` |
| M5 | Major | Required item fields dropped (anchor, confidence, `media_title`, `media_type`, source) | `spec/02-requirements.md:226` · `spec/08-synthesis.md:172-179` |
| m1 | Minor | Five evidence windows shifted or over-wide (EV3, EV12, EV14, EV16, EV17) | various |
| m2 | Minor | "REQ-071 lives in §5.2" — it is §5.1 (conclusion survives) | `spec/audit/req-coverage.md:54` |
| m3 | Minor | T791's label cited REQ-062 but only REQ-071b binds it | `spec/audit/req-coverage.md:54` |
| m4 | Minor | DP-5 called extra `RESOURCE_GATE` rows "dead duplication" while the repo keeps an explicit redundant row | `holonovel/src/core/badge-gate.ts:78-79` |
| m5 | Minor | Two register rationales superseded silently (surface counts, "templates") | `spec/audit/review-register.md:3042-3043` · `ROADMAP.md:22-23` |
| n1 | Nit | Status line stale | plan.md v1:3 |
| n2 | Nit | `key` omitted; `confidence` widened to `string` | `holonovel/src/core/wisdom.ts:16,19,53` |
| n3 | Nit | Duplicated `plans/` explanation across artifacts | plan.md v1:4-7 · tasks.md v1:5-7 |

Held up under checking: EV1, EV2, EV4, EV5, EV6, EV7, EV8, EV9, EV10, EV11, EV13, EV15,
EV18, EV19, EV20; `assemble` writes both generated copies; four concrete resources move
`resources/list` but not `resources/templates/list`; the bookkeeping set is otherwise
complete.

## Pass 2 — diff re-review of v2

Verdict: `independent-review FAILED. [plan.md] — 1 blocker`.
Reads: 5 (budget 10). Scope: resolution status plus defects introduced by the fixes.

| Prior | Status |
|---|---|
| B1 | Resolved — DP-2 fallback matches the real initialisation |
| B2 | Resolved — a `LOOP OPEN` placeholder passes the standalone gate; only close requires PAUSED |
| B3 | Resolved — DP-7, Phase 1 and assert 1 agree |
| M1 | Not resolved — (a) T325a/T325b cited as if they were Appendix F rows (they are harness blocks under the single `T325` row); (b) assert 4 demanded provenance from ruleset tone items, which had no such field |
| M2 | Resolved — REQ-022a/022b citations correct, edit is right |
| M3 | Not resolved — the specified helper took `callerBadge` while the handler passed the URI badge; no parameter carried view selection |
| M4 | Resolved with caveat — vendor fallback is mechanical, but `DEFAULT_WISDOM` items carry no `key` |
| M5 | Resolved with residual — shapes complete; ruleset `anchor: null` disclosed but undispositioned |
| m1–m5, n1–n3 | Resolved |

New defects raised in pass 2:

| Severity | Finding |
|---|---|
| Blocker | Assert 4 / V5 required provenance on every item while the ruleset tone branch had no provenance field — the only default-boot tone item |
| Major | The vendor fallback yielded items without `key`, while the payload requires `key: string` and sorts on it (`withWisdomKeys` is the existing normaliser) |
| Major | T325a/T325b exist only as harness blocks, not as Appendix F rows (the inheritance claim holds, the citation did not) |
| Nit | The v1 pass was recorded as "five stages" when it was one combined dispatch |

## Disposition after pass 2

The standard-depth re-review cap is reached (one re-review), so the parent applied every
pass-2 prescription in v3 and the user authorized one targeted confirmation pass beyond the
cap.

## Pass 3 — targeted confirmation of v3 (user-authorized)

Verdict: `independent-review passed. [plan.md] — 0 Blockers, 0 Majors, 4 Nits`.
Reads: 8. Scope: the three pass-2 prescriptions only.

| Item | Status | Predicate |
|---|---|---|
| Rev1 — ruleset tone provenance | Resolved | `plan.md` Phase 1 type and assignment, Phase 4 assert 4, V5, and `tasks.md` 13/14/29 agree; `provenanceTag` returns `[ruleset]` for a ruleset-tagged item (`holonovel/src/index.ts:16297`), and `T325a` already asserts a rendered resource item carries a `provenance` built by it (`holonovel/scripts/test-backfill.ts:2106-2110`) |
| Rev2 — keyed vendor fallback | Resolved | `withWisdomKeys` keys this module (`holonovel/src/core/wisdom.ts:461,472`) and is already imported (`holonovel/src/index.ts:68`) |
| Rev3 — two badge parameters | Resolved | `guidanceVoiceItems(viewBadge)` plus `canSeeGuidanceItem(item, callerBadge)`; the handler passes the URI badge as `viewBadge` and filters with the caller predicate |
| Rev4 — T325 citations | Resolved | `T325a` at `holonovel/scripts/test-backfill.ts:2101`, `T325b` at `:2118`, Appendix F's single `T325` row at `spec/appendices-reference.md:1771` — no phantom IDs remain |

Nits raised and applied by the parent: the `activeBadge`/`getBadge()` accessor name, the
view filter stated mechanically instead of in prose, the ruleset provenance routed through
`provenanceTag` instead of a hardcoded literal, and the stage/dispatch accounting (five
stages covered across three dispatches, not one).

Reviewer Unknowns carried forward

1. Hashes, HEAD and the fast-gate result were taken from the dispatch envelope; shell was
   denied in the reviewer's context.
2. Harness data-directory isolation between test blocks was not read, so the synthesis-run
   leakage question in Phase 4 assert 3 is unbounded but not contradicted.
3. The validator's orphan-test-ID rule was not read; m3's severity (gate failure vs
   under-reporting in the coverage register) is unconfirmed.
4. Project instruction files were injected into the reviewer's context mid-task; the findings
   rest only on files read directly.

## Pass 4 — delta confirmation (execution amendment A-1/A-2)

Verdict: `independent-review passed.` — 0 Blockers, 0 Majors, 2 Nits. Reads: 3 across two
windows (the first window was too narrow and reported itself incomplete rather than
passing unread text — recorded here because that behaviour is the useful part).

| Item | Status | Predicate |
|---|---|---|
| A-1 — `spec/build-phase-map.md` is a generated target and now covered | Confirmed | Files expected (`plan.md:521`), blast-radius row (`:495`), amendment A-1 (`:624-629`) agree |
| A-2 — the pre-existing 43/23-vs-40/22 count drift is recorded where the builder reads it | Confirmed | amendment A-2 (`:630-635`) plus the risk-row rewrite (`:562`) |
| Phase 1 ruleset provenance routed through `provenanceTag` | Confirmed by the parent after the reviewer's window | plan Phase 1 (`:385`), V5 (`:536`) and `holonovel/src/index.ts:16373` all name `provenanceTag({ tag: "ruleset" })` |

Nit carried as a stamp condition: Phase 1's provenance derivation must stay
`provenanceTag({ tag: "ruleset" })` so V5's parenthetical holds. Satisfied in the executed
code (`holonovel/src/index.ts:16373`).

Nit carried: stage accounting. Five review stages were covered across four dispatches
(v1 full review, v2 diff re-review, v3 targeted confirmation, v4/v5 delta window). The
stamp records `stages: 5` to mean stages covered, never dispatches.

## Parent-recorded delta (not cold-reviewed): A-3

`npm run build-order` regenerated `holonovel/src/generated/g7-attestation.ts`, whose
`SPEC_HASH` constant tracks the assembled spec. The diff is that single constant
(`f49af445…` → `a74df8c6…`), produced by `holonovel/scripts/generate-g7-attestation.ts`
itself. The file was missing from Files expected (plan authorised `build-order`, not the
artifact it writes), so it is amended as A-3 and carried as a stamp condition rather than
folded in silently. No cold reviewer saw this delta; the parent verified it against the
generator's own output and the one-line diff.

## Parent-recorded delta (not cold-reviewed): A-4

Inserting 144 lines in `holonovel/src/index.ts` invalidated one Holosuite conformance
evidence anchor (`holonovel/scripts/lib/holosuite-conformance.ts:37`,
`PREDICATE_PROMPTS`), which is line-and-token addressed. Re-pointed 17487 → 17631 (the
`server.prompt("intro", …)` registration). Verified by `npm run fix-anchors` ("predicates
current") and `npm run test:holosuite-conformance` (45 passed, 0 failed). Not cold-reviewed;
carried as a stamp condition like A-1/A-3.
