# U1 review — foundations and constitution

Chunk U1 of the unscoped-surface review program
(`docs/plans/2026-11-10-unscoped-surface-review/worklist.md:100-113`).
Artifact of `docs/plans/2026-11-14-unscoped-u1/plan.md`; 80 verdict rows as the
plan's "Surface inventory" budgets.

Method: every row names a unit of the chunk's surface, the anchor that defines
it, a verdict, and the predicate or declaration that settles it. A predicate is
cited by `file:line`; a declaration is the clause that states the rule is not
mechanically checked. Verdict vocabulary: `holds` (the claim is true or the
unit makes no enforceable claim), `finding:<ID>`, `builder-side` (enforcement
belongs to the builder, verifier, or convergence loop, not to a gate).

## Mapping table (built before the verdicts)

| Predicate | Condition tested | Severity | Anchor |
|---|---|---|---|
| `checkReqShape` | paragraph count, embedded table, bullet list, numbered steps, SHALL count | error under `--sdd-strict`; the 9–12 SHALL band is a warning | `scripts/validate.ts:223-263`, `:2245` |
| `checkSpecViolations` | 800-char body, parameter types, `Default:`, >5-token catalog, lifecycle repetition | error under `--sdd-strict` | `validate.ts:188-221` |
| `checkReqIdGrammar` | REQ ID grammar (≤3 base digits, letter-first suffix) | error | `scripts/lib/req-checks.ts:6` |
| `checkEmptyReqBodies` / `checkTruncatedReqBodies` | empty body; lowercase start | error | `req-checks.ts:21,36` |
| `checkFamilyCheckCoverage` | one `_Check:_` per REQ family | error | `req-checks.ts:167` |
| `checkReqDefaultClauses` / `checkReqWorkedExamples` / `checkReqThresholds` / `checkReqProceduralContent` | six authoring-convention classes | error | `req-checks.ts:203,220,238,190` |
| `checkAmbiguity` + term drift | hedging, vague qualifiers, canonical-term drift | warning | `validate.ts:266`, `:600-612` |
| Readability | REQ body grade 18; §0–§4 narrative grade 12; reference prose grade 18 | warning | `validate.ts:614-623,626-635,636-647`, scorer `:471-474` |
| `reportSectionCounts` | per-§5-subsection REQ count, printed | informational | `validate.ts:802-819` |
| Coupling checks | property-group pairs, archetype rules, `Behavioral` annotations, config parity | error | `validate.ts:1046,1270,1623`; `req-checks.ts:111,263` |
| Coverage checks | bucket classification, new-bucket-B, direct evidence, register freshness | error (strict impl audit) | `validate.ts:2022,1570,2115`; `req-checks.ts:310` |
| `checkCrossRefs` | every REQ citation resolves | error | `validate.ts:323` |
| `action-conflicts --check` | action-contract candidate outside the baseline | error, both modes | `scripts/lib/gate-manifest.ts:262-265`; `scripts/action-conflicts.ts:12-15,30` |
| `check-guarded-rule-change` | Appendix M rule + validator pattern co-change without a register entry | error | `scripts/check-guarded-rule-change.ts:3-17` |
| `compare-spec-code --dedicated` | bucket-C REQs with no dedicated test | report-only (fails only with `--gate`) | `scripts/compare-spec-code.ts:589-605`; publication calls it without `--gate` (`scripts/publish/steps.ts:258-262`) |
| `parse-spec` substrate | `readSpec`, `extractReqBodies`, `extractReqHeaders`, `extractNarrativeProse`, `splitSentences` feed the predicates above | n/a (substrate) | `scripts/lib/parse-spec.ts:11,36,51,208,121` |
| Script discipline gates | shebang, role header, exit codes, path and shell rules — AGENTS.md discipline, not a §1–§4 rule | error | `scripts/check-script-discipline.ts`; `check-script-quality` |

`--sdd-strict` path: `package.json:9` (`validate:sdd`) and `:60` (`check`) →
`scripts/lib/gate-manifest.ts:33-36` → `validate.ts:50` → error emission at
`:2245,2254,2360,2438`. Verified: `npx tsx scripts/validate.ts --sdd-strict` →
0 errors, 296 warnings.

Fingerprint sets (`scripts/lib/contract-fingerprint.ts:27,37-43`): package-format
= §5.16, §5.17, §6.3, §6.4.2; data-format = §5.6, §5.9, §5.19, §5.21–§5.28,
§5.31, §5.32, §7.7, Appendix Q. No §1–§4, Appendix A, or Appendix M section is
fingerprinted.

## Verdicts

| # | Surface | Anchor | Verdict | Predicate / reason |
|---|---|---|---|---|
| 1 | §1 Mission and Play Model | `spec/01-foundations.md:104-189` | holds | All REQ citations resolve (`checkCrossRefs`, `validate.ts:323`; 0 errors under `--sdd-strict`); play-model claims match the §4 terminology table and REQ-305/306/031/066; REQ-092 and REQ-380c resolve in Appendix E |
| 2 | §2 Requirements at a Glance | `:191-211` | holds | "verify it mechanically" is true: the REQ MANIFEST pass (`validate.ts:2175-2185`) checks every Appendix E row; §5.21–§5.23, §5.24–§5.33, §5.34 all exist (`02-requirements.md:4155,4186,4420`); section-map completeness gated at `validate.ts:1209` |
| 3 | §3 How This Build Fails | `:215-294` | holds | All 16 mitigations resolve: H3/H4/H11 are handoff steps (`06-artifacts.md:48,49,56`), G0b/G2/G8 are §8 workflows, REQ-058/055/201/381 are bucket C; REQ-011/171/379/382 are bucket E by design (build/verifier-side) |
| 4 | §4 rule 1 — no state between calls | `spec/01a-constitution.md:12-13` | holds | REQ-092 bucket C (T475, T77, T125, T138, T156, T261); the rule claims no static predicate |
| 5 | §4 rule 2 — deterministic seeding | `:14` | holds | REQ-050 bucket C (T27, T90, T111) |
| 6 | §4 rule 3 — no outbound network | `:15` | holds | REQ-051 bucket C (T41) |
| 7 | §4 rule 4 — validate client input | `:16` | holds | REQ-054 bucket C (T20, T42, T487) |
| 8 | §4 rule 5 — badge gating server-side | `:17` | holds | REQ-032 bucket C (55 exercised tests) |
| 9 | §4 rule 6 — narrator proposes, engine executes | `:18-22` | holds | REQ-032 bucket C; REQ-058 bucket C (T41, T42, T44); REQ-059 bucket C (T39a) |
| 10 | §4 rule 7 — contracts, not implementations | `:23-25` | holds | `checkSpecViolations` (`validate.ts:195` parameter types, `:198` `Default:`, `:205-210` catalogs) errors under `--sdd-strict`; Appendix M governs the rest |
| 11 | §4 rule 8 — red-team every REQ | `:26-35` | holds | Declared non-mechanical at `:34-35`; D2 (declaration is compliance) |
| 12 | §4 rule 9 — ruleset-free skip | `:36-42` | holds | Makes no mechanical claim; the annotation form is exercised by the handoff rows (`06-artifacts.md:46` H1, `:55` H10) and §9 H12; builder/verifier discipline |
| 13 | §4 rule 10 — plain English, no tool names | `:43-53` | finding:F-U1-2 | `:52-53` claims "verified at G4 and G5": G4 is Derived tests (`spec/05-verification.md:95`), G5 is the Pattern Buffer (`:111`); neither scans prompt text, and no harness does (grep across `holonovel/scripts`) |
| 14 | §4 rule 11 — config alignment | `:54-70` | holds | `checkCouplingCompleteness` (`validate.ts:1046`), `checkConfigCouplingAnnotations` (`:1270`); `spec_health` reports `behavioral_total`/`behavioral_coupled` (`holonovel/src/index.ts:14516-14517`) |
| 15 | §4 rule 12 — REQ atomicity | `:71-76` | holds | `checkReqShape` (`validate.ts:228-245`) errors under `--sdd-strict` (`:2245`); 0 errors today, so "no exceptions" is true |
| 16 | §4 Technology stack | `:178-183` | holds | Carries its own `_Check:_ T92`; alternative stacks are explicitly permitted with a DECISIONS.md (2) record, so no single implementation is gated |
| 17 | §4 Distribution | `:185-189` | holds | Builder obligation (container, single binary, or npx package); no mechanical claim |
| 18 | §4 terminology table | `:80-177` | holds | 88 entries on 97 lines; every REQ citation resolves (`checkCrossRefs`); 0 collisions with Appendix S definitions; the 7 overlaps with Appendix R are its forward-reference glossary (`appendices-reference.md:3367-3372`), not deprecations |
| 19 | App. A — encoding | `appendices-reference.md:5-6` | builder-side | Builder's parse discipline; no gate claim |
| 20 | App. A — headings | `:8-9` | builder-side | Anchor derivation cites REQ-194 (bucket C, T236); the rule itself is builder behaviour |
| 21 | App. A — role scoping | `:11-16` | builder-side | Build-time classification rule; adversarial cases belong to §6.5 |
| 22 | App. A — tables | `:18-23` | builder-side | Extraction convention; no gate claim |
| 23 | App. A — bold-labeled fields | `:25-27` | builder-side | Extraction convention; no gate claim |
| 24 | App. A — defect classes | `:29-32` | builder-side | Classification vocabulary for the convergence loop; no gate claim |
| 25 | App. A — other elements | `:34-39` | builder-side | Includes the cross-file comparison rule, enforced by §6.5 |
| 26 | App. A — classification | `:41-49` | builder-side | `:46-49` explicitly hands threshold enforcement to §6.5; no gate claimed |
| 27 | M — states what, not how | `:2783` | holds | `checkSpecViolations` `:195` (parameter types) and `:205-210` (catalogs) |
| 28 | M — no `Default:` clauses | `:2784-2787` | holds | `checkSpecViolations` `:198`; `checkReqDefaultClauses` (`req-checks.ts:203`); Appendix O.11 tuning values are the documented exception |
| 29 | M — no catalogs >5 tokens | `:2788` | holds | `checkSpecViolations` `:205-210` |
| 30 | M — no worked examples | `:2789-2792` | holds | `checkReqWorkedExamples` (`req-checks.ts:220`) |
| 31 | M — rule change + validator co-change | `:2793-2796` | holds | `check-guarded-rule-change.ts` blocks an unacknowledged co-change; `--base <ref>` for the CI form |
| 32 | M — trust-the-loop test | `:2797` | holds | Declared non-mechanical at `:2997-2999`; D2 |
| 33 | M — red-team test | `:2798` | holds | Declared non-mechanical at `:26-35`; D2 |
| 34 | M — Holodeck archetypes | `:2799-2800` | holds | `checkCouplingCompleteness` (`validate.ts:1046`); `checkPropertyGroupCount` (`req-checks.ts:111`) |
| 35 | M — content sources | `:2801-2803` | holds | `checkCouplingCompleteness` derives population from the coupling table |
| 36 | M — new Novel-persisted state | `:2804-2806` | holds | `checkCouplingCompleteness` + the §7.7.0 non-coupling class contract; property-group count gate |
| 37 | M — lifecycle coverage | `:2807-2809` | holds | Declared checklist rule (policy against precedent); no mechanical claim |
| 38 | M — audit wiring | `:2810-2812` | holds | REQ-040 bucket C (T8, T70, T100, T203, T147, T786); REQ-174/404 resolve and are tool-citation clean |
| 39 | M — guardrail surfaces | `:2813-2814` | holds | REQ-400/407 resolve; §5.19 enumerations are the named surface |
| 40 | M — retention bounds | `:2815-2816` | holds | Declared checklist rule; no mechanical claim |
| 41 | M — gate classification | `:2817-2818` | holds | `check-traceability` + `check-registers` gate the DECISIONS.md tables |
| 42 | M — read-only description phrasing | `:2819-2822` | holds | `scripts/tool-definitions-lint.ts` enforces the REQ-552 verb ban |
| 43 | M — vocabulary registration | `:2823-2825` | holds | Term-drift check (`validate.ts:600-612`) against the §4/Appendix S canonical set; deprecations in Appendix R |
| 44 | M — Holodeck config alignment | `:2826-2830` | holds | `checkConfigCouplingAnnotations` (`:1270`) + `checkConfigSurfaceParity` (`:1623`); `refresh-properties` regenerates |
| 45 | M — convergence metric ownership | `:2831-2832` | holds | §6.5's metric table owns the `host-verified`/package-owned split; declared checklist rule |
| 46 | M — one-paragraph body | `:2833-2834` | holds | `checkReqShape` `:228-230` (error) |
| 47 | M — ≤800 characters | `:2835` | holds | `checkSpecViolations` `:191` (error) |
| 48 | M — one logical contract | `:2836-2837` | holds | `checkReqShape` SHALL-count heuristic (`:247-252`); the rule states a judgement, and the heuristic flags 9+ |
| 49 | M — action-contract uniqueness | `:2838-2848` | finding:F-U1-1 | `:2847-2848` calls `action-conflicts` "report-only; not a gate"; `gate-manifest.ts:262-265` gates `--check` in both modes, failing outside `spec/audit/action-conflicts-baseline.json` (`action-conflicts.ts:12-15`) |
| 50 | M — assertion relevance | `:2849-2855` | holds | Declared non-mechanical: the `--dedicated` detector over-flags on the corpus and is report-only (`compare-spec-code.ts:589-605`); D2 |
| 51 | M — config declaration | `:2856-2858` | holds | `checkConfigSurfaceParity` (`validate.ts:1623`) |
| 52 | M — gating consistency | `:2859-2862` | holds | Declared checklist rule (one owner per gated surface); no predicate claimed |
| 53 | M — procedural content in §6/§7 | `:2863` | holds | `checkReqProceduralContent` (`req-checks.ts:190`) |
| 54 | M — ≤8 sentences | `:2864` | finding:F-U1-3 | No predicate reads `entry.sentences` (`checkReqShape` uses only `body`, `validate.ts:223-263`); 7 REQs currently exceed 8 (max 11) |
| 55 | M — ≤5 backtick tokens | `:2865` | holds | `checkSpecViolations` `:205-210` |
| 56 | M — coverage class | `:2866-2872` | holds | `checkImplCoverage` (`validate.ts:2022`) assigns buckets; `checkNewBucketB` (`req-checks.ts:310`) guards new B entrants |
| 57 | M — mechanical consequences | `:2873-2879` | holds | `checkCoverageRegisterFresh` (`:2115`), `checkDirectEvidenceForNewReqs` (`:1570`), `checkConfigSurfaceParity` (`:1623`), `check-fingerprint-sync` |
| 58 | M — committed-artifact feasibility | `:2880-2886` | holds | Declared checklist rule (verify the artifact at plan time); no predicate claimed |
| 59 | M SDD — 800 characters | `:2942-2943` | holds | `checkSpecViolations` `:191` |
| 60 | M SDD — no tables | `:2944` | holds | `checkReqShape` `:232-234` |
| 61 | M SDD — no bullets or numbered steps | `:2945` | holds | `checkReqShape` `:236-245` |
| 62 | M SDD — one paragraph | `:2945-2946` | holds | `checkReqShape` `:228-230` |
| 63 | M SDD — ≤8 sentences | `:2946` | finding:F-U1-3 | Same predicate as row 54; the claim is in the "mechanically enforced" list (`:2939-2940`) |
| 64 | M SDD — >8 SHALL clauses | `:2947` | finding:F-U1-4 | `checkReqShape` emits "review for splitting" for 9–12 (`:250-251`), which `isSoft` (`:2245`) downgrades to a warning even under `--sdd-strict`; only >12 errors (`:249`). The prose lists it as blocking (`:2960-2961`) |
| 65 | M SDD — family Check trailer | `:2948-2950` | holds | `checkFamilyCheckCoverage` (`req-checks.ts:167`) |
| 66 | M SDD — ≤5 backtick tokens | `:2951` | holds | `checkSpecViolations` `:205-210` |
| 67 | M SDD — REQ ID grammar | `:2952-2953` | holds | `checkReqIdGrammar` (`req-checks.ts:6`) |
| 68 | M SDD — non-empty body | `:2954-2957` | holds | `checkEmptyReqBodies` (`req-checks.ts:21`) |
| 69 | M SDD — no lowercase start | `:2958` | holds | `checkTruncatedReqBodies` (`req-checks.ts:36`) |
| 70 | M — prose readability (grade 12) | `:2896-2902` | finding:F-U1-5 | Scorer exists (`validate.ts:626-635`) and fires on the reading guide, §1, §2 (15.5, 13.1, 12.7); but the extractor walks the guide through §4 (`parse-spec.ts:208-212`) and scores the numbered rules the standard exempts. (The guide's "about 73%" is a hedged estimate with no check; noted, not a finding) |
| 71 | M — REQ-body readability (grade 18) | `:2904-2914` | holds | Scorer `validate.ts:614-623`; 104 pre-existing warnings are §5 content, outside U1 |
| 72 | M — reference-prose standard | `:2916-2921` | holds | Scorer `validate.ts:636-647`; the accepted-exception mechanism is DECISIONS.md + `spec/audit/proofread-register.md` |
| 73 | M — REQ anatomy | `:2923-2930` | holds | `checkReqShape` + `checkSpecViolations` cover the enumerated limits; "no grandfathering" is true — no baseline or suppression path exists for shape issues |
| 74 | M — provenance | `:2932-2937` | holds | Declared checklist rule (CHANGELOG practice); git history is the mechanism, not a gate |
| 75 | M — bloat prevention | `:2965-2973` | finding:F-U1-6 | The reporting claim is true — `reportSectionCounts` (`validate.ts:802-819`) prints the counts, and the paragraph calls the check informational — but the rule requires a maintainer review when a subsection exceeds 40 REQs, five do (5.3, 5.6, 5.8, 5.9, 5.12), and no record of such a review exists |
| 76 | M — what belongs elsewhere | `:2975-2995` | holds | Guidance list; each destination section exists; no mechanical claim |
| 77 | M — trust-the-loop test | `:2997-2999` | holds | Declared non-mechanical (it is a judgement about the loop) |
| 78 | M — guidance boundaries | `:3001-3010` | holds | Declared policy (Standing Rule 7 boundary); no predicate claimed |
| 79 | M — EARS notation | `:3012-3027` | holds | Declared optional ("encouraged — but not required"); no predicate claimed |
| 80 | M — convergence-driven review | `:3029-3037` | holds | Declared maintainer signal recorded in DECISIONS.md (5); no predicate claimed |
