# Review — U8: repo governance and content assets

Increment: `docs/plans/2026-11-15-unscoped-u8/` · session 2026-11-15 · HEAD
`eb686b5` at the baseline. Lens: `drift-report` plus content/licensing review.

Verdict vocabulary is `plan.md`'s: `PASS`; `DEFECT U8-Fn`; `builder-side`;
`external-skill`; `UNSET`. A predicate is the `file:line` of the condition the
claim rests on. Sample rule: stride 10 up to the block's last row, at most 10
samples.

| Row | Unit | Predicate | Verdict | Tier |
|---|---|---|---|---|
| R1 | README DESIGN ↔ validator | `scripts/validate-readme.ts:44-70,147-164,470-476`; the three "validator enforces" clauses (`:26,57,165`) all have a check | DEFECT U8-F7 | P3 |
| R2 | README Orientation + TOC | `README.md:182-207`; `validate-readme` TOC consistency passes | PASS | — |
| R3 | README §1 Install | `README.md:211-253`; DESIGN `:63` said Node 24+ while the body and `holonovel/package.json:149-151` say 22+ | DEFECT U8-F1 | P2 |
| R4 | README §1 Install a ruleset | `README.md:255-274`; `npx -y holonovel update` exists (`holonovel/bin/holonovel.js:6-16`) | PASS | — |
| R5 | README §2 Convert/Build | `README.md:276-317`; zero-code build claim matches §6 | PASS | — |
| R6 | README §2 Holodeck/Novel | `README.md:319-406`; badge/autonomy claims match `SECURITY.md:41-49` | PASS | — |
| R7 | README §2 Synthesis | `README.md:408-434`; inert-by-default matches `spec/08-synthesis.md` | PASS | — |
| R8 | README §3 comparison | `README.md:436-452`; three category rows, closing prose names D&D 5e and Starfinder | PASS | — |
| R9 | README License list | `README.md:454-479`; 13 bullets against `NOTICE.md:11-23`, same set (Appendix U order) | PASS | — |
| R10 | README `@spec:date` marker | `README.md:479`; `check-markers` passes; date equals the package version date | PASS | — |
| R11 | AGENTS layer map | `AGENTS.md:19-118`; `:39` said "D–S", implying Appendix N lives in the reference file, which `:40` assigns to fixtures | DEFECT U8-F3 | P2 |
| R12 | AGENTS conventions | `AGENTS.md:119-185`; commit/prose/spec-editing rules match the tooling | PASS | — |
| R13 | AGENTS routine + script discipline | `AGENTS.md:186-284`; every mapped command exists; detectors gate | PASS | — |
| R14 | AGENTS gates + CI-only | `AGENTS.md:285-466`; `check-gate-table` passes | PASS | — |
| R15 | AGENTS review governance | `AGENTS.md:467-510`; disposition set matches `scripts/lib/register-checks.ts` | PASS | — |
| R16 | AGENTS commit checklist | `AGENTS.md:511-564`; each "guarded by" gate appears in the manifest | PASS | — |
| R17 | SECURITY.md | `SECURITY.md:1-70`; `test:data-dir` 18/18 passes; REQ citations resolve | PASS | — |
| R18 | root package.json | `package.json:1-112`; 45 gates green; engine floor 24+ is the dev-tool floor | PASS | — |
| R19 | holonovel/README requirements/install/config | `holonovel/README.md:1-40`; Node 22+ matches the server package | PASS | — |
| R20 | holonovel/README Data + Tool surface | `:41-72`; `:57` said 36 tools against 37 in `tool-definitions.json:3` | DEFECT U8-F2 | P0 |
| R21 | holonovel/README Configuration | `:73-89`; all ten variables are read in `holonovel/src` | PASS | — |
| R22 | holonovel/README Development + License | `:90-138`; scripts exist; 13 attribution bullets | PASS | — |
| R23 | holonovel/AGENTS layer map | `holonovel/AGENTS.md:1-64`; counts line `:46`; 40 resources/6 prompts are marker-gated, 22 templates are not | DEFECT U8-F9 | P3 |
| R24 | holonovel/AGENTS Tool Surface | `:65-137`; all 37 names resolve; action lists sampled at stride 5 agree | PASS | — |
| R25 | holonovel/AGENTS Running/Boot/Packaging | `:138-194`; tarball claim omits `adventures/` and `NOTICE.md` | DEFECT U8-F11 | P3 |
| R26 | holonovel/AGENTS State Model | `:195-210`; `<DATA_DIR>` is per-OS but the bullets write `.holonovel-state/…` paths | DEFECT U8-F8 | P3 |
| R27 | holonovel/AGENTS Two-Repo/Retiring | `:211-253`; `consolidate-novels.ts` and `retention-prune.ts` exist | PASS | — |
| R28 | DECISIONS current records | `:1-11`; registry: 299 declarations, 54 retired, 245 canonical — matches the budget | PASS | — |
| R29 | DECISIONS `## Non-goals` | `:13-1371`; `check-roadmap` resolves the pointer and every entry cites a REQ | PASS | — |
| R30 | DECISIONS classifications | `:1491-1581`; `check-traceability` 108 rows, 0 stale | PASS | — |
| R31 | DECISIONS dated entries | `:1372-1490,1582-2906` sample: dated counts are history, claims resolve at their date | PASS | — |
| R32 | NOTICE / LICENSE chain | `NOTICE.md:1-27`; `holonovel/LICENSE.md` MIT; 13 sources match Appendix U | PASS | — |
| R33 | Dockerfile | `holonovel/Dockerfile:19-22`; NOTICE points at `LICENSE.md`, which the image did not copy | DEFECT U8-F5 | P1 |
| R34 | Review-register shape | `spec/audit/review-register.md:1-20`; parser-readable; `check-registers --strict` green | PASS | — |
| R35 | Scheduled-roadmap pointers | `review-register.md:2976-2988` named a dead §5.3 section and a missing F-P2-4 bullet | DEFECT U8-F6 | P1 |
| R36 | Resolved bullets sample | `:16-60`; U7-F1's corrected gate names hold; U5-F8's audit is current | PASS | — |
| R37 | Closed-P3 sample | `:2993-3012`; U7-F6/F7 carry legal dispositions and reasons | PASS | — |
| R38 | req-coverage freshness | `spec/audit/req-coverage.md`; the coverage audit inside `validate` passes | PASS | — |
| R39 | proofread register | `spec/audit/proofread-register.md`; `check-registers --strict` green, 125 grandfathered undated | PASS | — |
| R40 | Baselines | action-conflicts, script-quality, conformance, surface-budget, surface-replay all green | PASS | — |
| R41 | performance-record | `check-performance-record` green | PASS | — |
| R42 | tdqs-scoreboard | `check-tdqs-scoreboard` green (read-only; U7 owned the tier bar) | PASS | — |
| R43 | dated reports | `spec/audit/remediation-2026-08-24.md`, `spec-code-comparison-2026-09-25.md` are dated and archived | PASS | — |
| R44 | ROADMAP admission | `ROADMAP.md:1-74`; `check-roadmap` green; four sections after the close | PASS | — |
| R45 | CHANGELOG conventions | `CHANGELOG.md:1-3`; top heading matches `session-close`'s pattern | PASS | — |
| R46 | narrative READMEs | `holonovel/narrative_world_model/narrative/README.md:13` claimed "(59 documents)" for a directory holding README + LICENSE | DEFECT U8-F4 | P1 |
| R47 | MANIFEST hashes | `check:vendor` 25/25 match, 0 missing | PASS | — |
| R48 | MANIFEST File cells | all 25 File cells resolve under `narrative/` | PASS | — |
| R49 | licence parity | `check-reference-server-cleanliness` clause (c) green | PASS | — |
| R50 | world provider | `check-world-provider` fresh | PASS | — |
| R51 | starter content | `check-starter-freshness` green; source artifact present | PASS | — |
| R52 | content boundary | clauses (a)/(b) green | PASS | — |
| R53 | adventure index | `check-adventure-index` fresh (read-only) | PASS | — |
| R54 | docs/upstream/cof.md | `docs/upstream/cof.md:1-50`; licence split matches Appendix U's COF cell | PASS | — |
| R55 | ATTRIBUTION non-table sections | `docs/licenses/ATTRIBUTION.md:28-87`; competitive rows and requested strings are consistent | PASS | — |
| R56 | docs/e5 report | `docs/e5-world-pack-gap-report.md:1-122`; dated, status current, no stale owner | PASS | — |
| R57 | docs/ruleset-index-phase0 | `docs/ruleset-index-phase0.md:1-53`; closed no-go with a reopen predicate | PASS | — |
| R58 | increment contract | `docs/plans/README.md:13-70`; layout and tokens match `loop-artifacts` | PASS | — |
| R59 | increment history sample | `docs/plans/2026-11-14-unscoped-u3/aar.md` ends `LOOP PAUSED`; no live contract claimed | PASS | — |
| R60 | cross-document links | every relative link in the five governance docs resolves | PASS | — |

## Totals

60 rows: 50 `PASS`, 10 `DEFECT`. Findings: 6 `Resolved` in this increment
(U8-F1…F6 — 1 P0, 3 P1, 2 P2), 4 `Closed-P3` (U8-F7, U8-F8, U8-F9, U8-F11).
No row is `UNSET`.

## Bounded fixes applied (6.2)

| Finding | File | Change |
|---|---|---|
| U8-F1 | `README.md:63` | DESIGN prerequisite corrected to Node.js 22+, matching the body and the server package |
| U8-F2 | `holonovel/README.md:57` | 36 → 37 |
| U8-F3 | `AGENTS.md:39` | "D–S" → "D–M, O–S" |
| U8-F4 | `narrative/README.md:13` | the IF Craft cell now names the vendored files and says the 59-document corpus is an upstream install |
| U8-F5 | `holonovel/Dockerfile:22` | `LICENSE.md` added to the runtime COPY, so the image carries the licence its NOTICE cites |
| U8-F6 | `spec/audit/review-register.md:2976-2988`, `ROADMAP.md` | the dead §5.3 pointer is gone, the missing F-P2-4 bullet is replaced by a live roadmap section naming the residual comment |
