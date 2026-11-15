# Diff re-review — U6 plan v1 → v2

Reviewer: review subagent (DeepSeek V4.1 Flash, cold; diff scope)
Revised plan sha256: a677bebe17ba3b5cc5f9afd973c7695f785fcbb9797b6c4d409d99023984437b
Prior pass: `report.md` in this directory (4 Blockers, 7 Majors, 11 Minors,
3 Nits)
Reads used: 7 of 10 · Verdict: `independent-review passed.` (no Blocker)

## Status of prior findings

### Blockers

| # | Status | Evidence |
|---|---|---|
| B1 | Resolved | R3 owns `:43-51` (`plan:178`), R7 owns `:125-180` incl. module catalogue (`:182`), R22 owns `:347-355` (`:197`). §11 = 27 rows (`:165,172`), total 66 (`:167-168`). Tables contiguous: R1–R27 cover `1-18, 20-408` (only `:19` blank), R28–R57 cover `1-1208`, R58–R66 are the 9 units. No gaps, no overlaps. |
| B2 | Resolved | R28 = `spec/appendices-fixtures.md:1-30` (`:208`); size claim split — file 1,208 lines, matrix `:1-30`, Appendices B–Z `:31-1208` (`:33`, `:127`). |
| B3 | Resolved | 4.6 (`:372-377`) regenerates after the last prose edit (4.5) and before the V table: `npm run assemble` then `npx tsx holonovel/scripts/generate-g7-attestation.ts`. Generator without `--check` writes `holonovel/src/generated/g7-attestation.ts` and the generated table in `holonovel/DECISIONS.md` (`generate-g7-attestation.ts:227-228`; installed hash `:180`). Both outputs in blast radius (`:390`, `:11-12`) and rollback; `**Spec hash:**` explicitly push-time (`:376-377`). |
| B4 | Resolved | Phase 0 step 6 (`:273-276`) adds `plan.md` + authored `tasks.md`, defers `review.md`/`aar.md`. Phase 4: 4.1 `review.md`, 4.7 CHANGELOG + `aar.md`, then **(V)**, then 4.8 `session:close`. V4 now runs with `aar.md` present. |

### Majors

| # | Status | Evidence |
|---|---|---|
| M1 | Resolved | V9 relabelled source-anchors-only with the Markdown caveat (`:414`); 4.2 requires `sed -n` per surviving `file:line` (`:360`); K3 reworded (`:429`). |
| M2 | Resolved | V5 = `npm run check-registers:strict` (`:410`); done bar 2 binds V5; `package.json:35` confirmed. |
| M3 | Resolved | Done bar 6 requires `LOOP PAUSED` (`:454-455`); K4 records UNSET/no-commit/U6b; 4.4 keeps the pointer at U6 on that branch. |
| M4 | Resolved at 4.7 — resolution blurb misnumbered (see N1) | CHANGELOG written at 4.7 before the V table (`:378-380`). |
| M5 | Resolved | `:13` now "EV1, EV2, EV12, EV16", matching `:120,121,131,135`. |
| M6 | Resolved | `:108` "nine harness/data units"; `:167-168` arithmetic. |
| M7 | Resolved | V8 = `npm run lint` + `npm run validate:sdd` (`:413`); Docker rationale `:418-421`; `package.json:7,9` verified. |

### Minors

| # | Status | Evidence |
|---|---|---|
| m1 | Resolved | `worklist.md:96` at `:138`, `:361`, `:450`. |
| m2 | Resolved | `holonovel/package.json:90` at `:130`. |
| m3 | Resolved | "thirteen `SPEC_FILES`" at `:134`. |
| m4 | Resolved | `phase-map-hash.ts:18-32,36-44`, `assemble.ts:18-19` at `:134`. |
| m5 | Partially resolved — see N2 | U6-F2 named at `:268-271`, but no step edits `worklist.md:256-258`. |
| m6 | Resolved | `**reviewed 2026-11-15** — 66 rows` at `:81`, `:362`. |
| m7 | Resolved | Scope `:146`; R58 path spelled at `:243`. |
| m8 | Resolved | R65 narrowed to writers other than the emitter (`:250`). |
| m9 | Resolved | `test:all` attribution `:347-349`; K5 `:431`. |
| m10 | Resolved | `:17-18` binds tracked `plan.cold/report.md`. |
| m11 | Resolved for the four named paths; residual N3 | Sidecar targets include the four files plus the increment dir. |
| Nits (3) | Resolved | V8 subsumption `:421`; "ROADMAP half" `:102-105`; appendix pricing `:33`/`:127`. |

## New findings (revised text only)

**N1 [Minor][clarity]** — Resolutions M4 says "Phase 4 **step 3.5** now writes the
dated section"; Phase 4 has no 3.5. The CHANGELOG is written at 4.7 (`:378-380`).
Fix: "step 4.7". Evidence: `plan:65` vs `plan:378`.

**N2 [Minor][clarity]** — Phase 0 step 5 declares U6-F2 `Resolved` when the
plan's own R49/R52/R55 anchors replace the stale ones, but no step replaces them:
4.3 edits only the U6 status row (`worklist.md:96`) and the U6 section, while the
stale anchors live on the **Prose** line at `worklist.md:256-258`
(`X :970`, `Y :1080`, `Z :1119`). Fix: add the anchor correction to 4.3, or
disposition U6-F2 differently with that reason. Evidence: `plan:270-271`,
`plan:361-365`, `worklist.md:256-258`.

**N3 [Minor][design]** — The re-run preflight sidecar omits `holonovel/holonovel.md`
(`plan:373-374`, `:390`) and `holonovel/DECISIONS.md` (`:375-376`, `:390`). Fix:
re-run `preflight` with both targets added.

**Observation (unchanged, not counted)** — `plan:363-364` says the U6 section
"gains an `**Exit evidence:**` line"; `worklist.md:266-268` already carries one,
so the action is "amend".

## Unknowns

- V2's "45 passed, 0 failed" after the added 4.6 regeneration is asserted, not
  executed (read-only dispatch).
- Whether `check-registers:strict` rejects an unsupported `Resolved` token: the
  script's structural rules were not opened this pass.

`independent-review passed.`
