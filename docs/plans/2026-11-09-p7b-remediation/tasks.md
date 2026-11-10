# Tasks — §5.2/§5.8 behaviour remediation

Status: complete · Plan: `plan.md` · Gate: plan-review (self, conditions recorded)

## Phase 0 — scaffolding

- [x] Plan written and gated (cold pass + delta re-review; 2 conditions recorded)
- [x] Baseline: `check:fast` PASS 37/37, HEAD `1fd3176`
- [x] `tasks.md` + `aar.md` (`LOOP OPEN`) present before commit 1

## Commit 1 — journal, lore surface, sheet (F-P7b-1, -2, -5)

- [x] `entity_ids` populated from active/present entity
- [x] sticky decay on `manage_scene (action: set)`; reset on re-match
- [x] `composeLoreSection` with presence gating, priority, `[world]`, budget
- [x] `spec_health.lore_budget`
- [x] `lore://groups` resource + template
- [x] `manage_lore (action: suggest)` structured rows + badge scoping
- [x] sheet known-information in text and JSON renderers
- [x] Appendix F T83 row corrected
- [x] Tests T282, T67, T79, T81, T82, T83, T274
- [x] Registers/roadmap/changelog; `test:output-contracts` 355, `test:narrative` 75, `check:fast` PASS, `build-order` OK

## Commit 2 — synthesis (F-P7b-3, -7)

- [x] per-item `collected_at` in rows and resources
- [x] `[supplementary] [LOW|MEDIUM]` rendering + LOW ordering
- [x] Novel-derived MEDIUM/LOW items on `run`
- [x] adventure synthesis derived view + inert-community prompt
- [x] Appendix F T63 row corrected
- [x] Tests T63, T95, T97, T102, T288, T325 (test:backfill 88 passed)

## Commit 3 — scene catalog and suggestions (F-P7b-4, -6)

- [x] open `scene_type` catalog with `[NOT_FOUND]` enumeration
- [x] independent action families
- [x] spell-slot-gated Cast actions
- [x] suggest empty result for unmatched intent
- [x] Tests T135, T71, T359, T68 (test:backfill 92 passed); tool definitions + surface baseline regenerated

## Commit 4 — table classification (F-P7b-9)

- [x] dynamic `table` enum in `tools/list`
- [x] runtime refusal of non-generation names
- [x] Test T255/T255b with seeded packages (test:backfill 94 passed)
- [x] build-order, full gates, AAR terminal token
