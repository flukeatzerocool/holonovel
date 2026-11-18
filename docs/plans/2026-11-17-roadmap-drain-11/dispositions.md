# Dispositions — REQ evidence linkage close (47 rows)

P1 read at `430e2bb`, pre-edit. `npm run validate` → `0 error(s), 352 warning(s)`,
`REQ evidence linkage: 47 finding(s)`; `grep -c '^| REQ-'` on the corpus = 47; one
`@section evidence` marker at `holonovel/DECISIONS.md:2511`.

Every row is class (b) — an `Automated` Appendix F row with no exercising site
(`scripts/lib/req-checks.ts:886-889`). The `disposition class` column is the closed set D3
defines. The `evidence` column is the P1 probe: a distinctive term from the row's Appendix F
text grepped over `scripts/` and `holonovel/scripts/` (`grep -rn --include=*.ts -i <term>`),
plus the row's own asserting artifact. One row is `author` (T253); the other 46 enter
`spec/audit/evidence-linkage-baseline.json` in P4.

**Stop-rule reading.** No probe found a harness `test("…")` title that already asserts a
residue row's clause under another T-ID, so no row converts to `author`. Adjacent behaviour is
recorded where it exists (T72/T73 Pattern Buffer scenarios, T379 codex creation in
`test-narrative.ts`, T371/T372 constraint-override contracts) but each is a different clause or
a non-title scenario, so none is evidence for the row.

| REQ | T-ID | disposition class | evidence | action |
|---|---|---|---|---|
| REQ-011c | T182 | build-time | Phase-1 `[category-confidence-block]` is a builder finding in DECISIONS (5); probe `category-confidence-block` → 0 hits | baseline |
| REQ-012 | T4 | server-drill | exact/prefix/substring rank-3 requires live `manage_ruleset (action: search)`; probe `substring quer` → 0 hits | baseline |
| REQ-088h2 | T379 | server-drill | codex→Novel bootstrap needs a live `manage_codex`/`manage_novel` call; probe `codex_adventure` → `test-narrative.ts:749` exercises the parameter, no title carries T379 | baseline |
| REQ-088h2 | T72 | server-drill | Novel state file/restart/end/resume needs a live server; probe `TTRPG_NOVEL` → 27 hits incl. `run_ruleset_pattern_buffer.ts:604`, no title carries T72 | baseline |
| REQ-088h2 | T73 | server-drill | Novel isolation across two Novels needs live calls; probe `novel isolation` → `run_ruleset_pattern_buffer.ts:235` (S13 scenario, not a test title) | baseline |
| REQ-100b | T87 | operator | a measurement run plus a DECISIONS (4) record; probe `query_latency_ms` → `check-performance-record.ts:30` asserts presence under T686, not the tier threshold | baseline |
| REQ-100d | T87 | operator | per-category latencies recorded by the builder; same probe as REQ-100b; no in-repo measurement record carries a tier | baseline |
| REQ-108b | T107 | pattern-buffer-gap | a DECISIONS (6) sub-workflow→REQ map over §5.5/§5.6/§5.7/REQ-002; probe `sub-workflow-to-REQ` → only the §6.6 map parser (`scripts/lib/subworkflow.ts:1`), no DECISIONS artifact | baseline |
| REQ-110 | T113 | server-drill | schema-identity comparison needs `tools/list` on a live server; probe `category enum` → 0 hits | baseline |
| REQ-111b | T114 | server-drill | search ranking/limit/context needs live queries; probe `suppressed-result` → 0 hits | baseline |
| REQ-114b | T117 | build-time | a curated intent set in RULESET_MODEL.md and a coverage percentage; probe `suggest coverage` → 0; no `RULESET_MODEL.md` in the tree (`find . -name RULESET_MODEL.md` → none) | baseline |
| REQ-131c | T145 | server-drill | initialization-order briefing needs a live restart drill; probe `initialization order` → one comment (`scripts/validate.ts:2080`), no assertion | baseline |
| REQ-141b | T163 | build-time | S14a failure mapping, Phase 2 re-entry, DECISIONS (6) record; probe `input-validation` → 0 hits | baseline |
| REQ-141k | T537 | pattern-buffer-gap | harness coverage of every §6.6 sub-workflow; chunk 9 measured 29 `s_id` scenarios against 37 sub-workflows (`docs/plans/2026-11-17-roadmap-drain-9/plan.md:110-116`) | baseline |
| REQ-141l | T539 | pattern-buffer-gap | partial-run disposition record with a fingerprint reason or operator acceptance; probe `partial-run` → 0 hits | baseline |
| REQ-142b | T164 | pattern-buffer-gap | blocking/non-blocking classification record per sub-workflow; probe `blocking classification` → 0 hits | baseline |
| REQ-146d | T174 | build-time | reconciliation-authority criteria and `[authority-tie]` defects on a three-section build; probe `authority-tie` → 0 hits | baseline |
| REQ-149 | T184 | server-drill | MCP conformance gate: launch a server, run every Appendix D check; probe `MCP conformance` → 0 hits | baseline |
| REQ-150b | T185 | build-time | G2 replay plus a per-contract coverage record in DECISIONS (6); no G2 record exists (`grep -n "^G2" holonovel/DECISIONS.md` → none) | baseline |
| REQ-162c | T197 | build-time | production/quick-build profiles and their DECISIONS annotations; probe `quick-build` → 0 hits | baseline |
| REQ-207c | T251 | build-time | core-mechanic identification on a fixture build with the §6.5 confidence threshold; probe `core resolution mechanic` → 0 hits | baseline |
| REQ-208b | T250 | build-time | Pattern Buffer failure→metric mapping recorded in DECISIONS (6); probe `mechanics-fidelity` → `run_ruleset_pattern_buffer.ts:8` (ruleset build scaffolding, no assertion of the mapping) | baseline |
| REQ-210b | T173 | build-time | per-chunk Concept resolution and deferred references in the build defect log; probe `deferred-reference` → 0 hits | baseline |
| REQ-211c | T188 | operator | H12 cold-checkout G2 replay record with command/exit_code/g2_result/env_pins; probe `H12` → 0 hits (`spec/06-artifacts.md:57` defines the record); same dependency as ROADMAP item 1 | baseline |
| REQ-211c | T253 | — | **asserted in P2** by `checkEvidenceRecordContract`: the `@section evidence` record at `holonovel/DECISIONS.md:2511-2522` parses to six non-empty fields, a canonical G7 workflow token, an ISO timestamp, `pass`, and a sub-check enumeration | author |
| REQ-212b | T46 | build-time | cross-file extraction on the fixture files (anchor, entity collapse, inline mechanics); probe `Marshwise` → 0 hits (the fixture text lives in `spec/appendices-fixtures.md`) | baseline |
| REQ-225b | T301 | build-time | synthesis extraction ≥4-of-7 modules with `[ruleset]` tags on a build; probe `voice_examples` → runtime hits only, no extraction assertion | baseline |
| REQ-228c | T304 | build-time | synthesis consistency during a Minor spec-driven update; probe `removed surface` → 0 hits | baseline |
| REQ-243d | T308 | build-time | synthesis population for a newly added surface, per-module counts in DECISIONS; probe `synthesis_manifest` → 0 hits | baseline |
| REQ-245e | T310 | build-time | a populated `synthesis_manifest.json` from a provider-doc build; probe `synthesis_manifest` → 0 hits (no such file in the tree) | baseline |
| REQ-245e | T495 | build-time | host-owned metric disposition recorded in DECISIONS (5) against a pre-built host; probe `host-verified` → 0 hits | baseline |
| REQ-273b | T293 | operator | Phase 1 independent verification: seed-pinned dice, prose tolerance, discrepancy classes (§10); probe `Unclassifiable` → 0 hits | baseline |
| REQ-302b | T346 | server-drill | per-section re-extraction and `spec_health.section_hashes` on a live build; probe `section_hashes` → 0 hits | baseline |
| REQ-315b | T360 | server-drill | `manage_diagnostics (action: health)` coverage plus live searches; probe `search_index_coverage` → 0 hits | baseline |
| REQ-327c | T371 | build-time | constraint-override extraction with type/mechanic/anchor on a build; probe `constraint override` → `test-output-contracts.ts:2465` asserts T372 (the runtime catalog), not the extraction record | baseline |
| REQ-369b | T436 | server-drill | scene↔NPC advisory couplings on live calls; probe `P41` → 0 hits | baseline |
| REQ-369b | T437 | server-drill | countdown→scene coupling with undo-stack visibility; probe `world_effect` → model types only (`holonovel/scripts/lib/playability-model.ts:72`) | baseline |
| REQ-369b | T438 | server-drill | lore→scene surfacing and badge scope on live calls; probe `lore-relevant` → 0 hits | baseline |
| REQ-371b | T422 | build-time | vendor Ruleset Wisdom rendered into a Novel requires a host carrying vendor Wisdom; probe `wisdom` → `scripts/validate.ts:1058` (archetype token list), no enactment assertion | baseline |
| REQ-371b | T428 | build-time | Wisdom mechanical enactment (S33) under a vendor-Wisdom host; probe `P7` → unrelated fingerprints and S27; no T428 assertion | baseline |
| REQ-371b | T496 | build-time | enrichment artifact-scope: `[ruleset]` ratio on the artifact, `[vendor]` only at runtime; probe `vendor manifest` → the manifest gate (`check-vendor-manifest.ts:160`), a different contract | baseline |
| REQ-375b | T426 | build-time | ≥30% Mechanical coupling nature over extracted Wisdom items; probe `mechanical coupling` → one comment (`scripts/validate.ts:2042`), no metric assertion | baseline |
| REQ-376a3 | T431 | pattern-buffer-gap | a DECISIONS (6) Holonovel sub-workflow→REQ map over §5.10/§5.12/§5.13/§5.15/REQ-367; the map ships in `spec/03-build.md:1948-1974` (25 rows) and its prose calls a gap "a review finding, not an assembly error" (`:1945-1946`); probe `Holonovel Pattern Buffer` → harness files only | baseline |
| REQ-376b | T431 | pattern-buffer-gap | same row as REQ-376a3 (two REQs cite one T-ID) | baseline |
| REQ-377d | T432 | build-time | coupling extraction against D&D 5e (Fireball/Darkness/Light/Hold Person); probe `Hold Person` → 0 hits; no committed coupling table in the reference tree | baseline |
| REQ-378b | T433 | build-time | coupling density and Mechanical share on a D&D 5e build; probe `low-mechanical-coupling` → 0 hits | baseline |
| REQ-416 | T489 | server-drill | config default inheritance rendered by `spec_health` on a live server; probe `defaults section` → 0 hits | baseline |

Class totals: `build-time` 22, `server-drill` 14, `pattern-buffer-gap` 6, `operator` 4,
`author` 1 = 47 rows. Baseline entries after P2: **46**.

## Unclaimed clauses (recorded, not claimed by the label)

- **`T253` per-workflow extensions** — G0 records enumerating Appendix H/D items individually,
  G2 per-contract coverage, G4 per-test counts, G5 per-sub-workflow verdicts. No such record
  exists in the tree to parse (the sole record is G7), so clauses (a)–(f) claim the field
  contract only.
- **`T253` null-DECISIONS path** — a scratch checkout with no `holonovel/DECISIONS.md` returns
  no findings, matching the existing Manual-rule skip (`scripts/lib/req-checks.ts:891-892`);
  the committed tree always carries the file.
- **`T87` after the row correction (P3)** — the row keeps the cold-start tier clause (REQ-100b)
  and the recording clauses, and loses only the latency threshold REQ-100a forbids. Its
  remaining obligations are a measurement run and a DECISIONS (4) record, which is why it is
  `operator`, not `spec-conflict`.
- **`T87` cannot be labelled on `check-performance-record.ts`** — that gate (T686) asserts a
  term is present or waived; the record carries no `tier` field and no five-category list, so a
  `T87` label there would be a copied ID.
- **`T188`** — the H12 record's four fields (`command`, `exit_code`, `g2_result`, `env_pins`) do
  not exist anywhere in DECISIONS.md; there is nothing to parse until the cold-checkout replay
  (ROADMAP item 1) runs.
