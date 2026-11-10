# Tasks — §5.2/§5.8 assertion repair

Status: complete · Plan: `plan.md` · Gate: plan-review passed. (fresh, delta)

## Phase 0 — scaffolding

- [x] `plan.md` written, cold-reviewed (FAILED), revised, delta re-reviewed (passed)
- [x] Plan stamped fresh (`sha256 2671b446…`, standard depth)
- [x] Baseline: `check:fast` PASS 37/37; HEAD `048fb5e`; `check-registers` PASS

## Phase 1 — probes (harness)

- [x] F-P7b-4 T136 → PASS (`test:backfill`, "T136/REQ-125")
- [x] F-P7b-3 T94 → PASS (`test:backfill`, "T94/REQ-103")
- [x] F-P7b-3 T144 → PASS (`test:backfill`, "T144/REQ-130")
- [x] F-P7b-7 T324 → PASS (`test:backfill`, "T324/REQ-265")
- [x] F-P7b-6 T68 → FAIL (nonsense intent falls back to spatial suggestions)
- [x] F-P7b-2 T67/T79 → FAIL (no GM lore briefing surface without presence)
- [x] F-P7b-2 T82 → FAIL (suggest returns previews only)
- [~] F-P7b-1, F-P7b-5, F-P7b-9 — no probe written; predicate verified in source
- [x] Failing probes deleted per plan §4; evidence recorded in the review register

## Phase 2 — spec citation (F-P7b-8)

- [x] REQ-082a → `_Check:_ T66.`
- [x] REQ-082b → `_Check:_ T205.`
- [x] REQ-082c → `_Check:_ T66.` (T205 dropped)
- [x] `npm run assemble` (holonovel.md + holonovel/holonovel.md regenerated)

## Phase 3 — registers

- [x] Review register: F-P7b-8 Resolved; F-P7b-1…7,9 updated with probe predicates
- [x] ROADMAP §5.2/§5.8 rewritten to the remaining remediation work
- [x] `npm run validate -- --write-register` (0 gaps)

## Phase 4 — verification

- [x] `npm run check-registers`
- [x] `npm run check-loop-artifacts`
- [x] `npm run check:fast` (unpiped)
- [x] `npm run session:close` → commit `441e7d8`
