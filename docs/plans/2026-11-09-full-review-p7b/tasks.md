# Tasks — Full-review sweep, chunk P7b (extraction and synthesis)

Status: complete · Plan: `plan.md` · Gate: plan-review passed. (fresh)

## Phase 0 — Baseline

- [x] Create `tasks.md` + provisional `aar.md` — before the first gate run
- [x] `npm run check:fast` → `check:fast: PASS` (37/37)
- [x] `npm run check` → `check: PASS`
- [x] `npm --prefix holonovel run test:all` → 56/56 PASS (134.0 s)
- [x] Targeted harnesses reached by `test:all`: `test:narrative`,
      `test:memory-recall`, `test:lean-narrator`, `test:briefing`,
      `test:selection`, `check:conversion-evidence`, `check:vendor`
- [x] `git status --porcelain` (increment directory only), HEAD `ee930b8`,
      18 commits ahead of `origin/main`
- [x] `git check-ignore` → exit 1, no output (committable)
- [x] Q1–Q10 recorded as D91–D100 in the sweep worklist
- [x] Preflight evidence sidecar + fresh stamp (cold report hash recorded)
- [x] Re-derived 58 + 131 = 189 REQs; 37 + 39 = 76 family rows; 32 C / 44 E

## Phase 1 — Code side (read-only review)

- [x] Surface enumerated: `core/wisdom.ts:61-81`, `core/prompt-composition.ts:90-343`,
      `core/memory.ts:116`, `core/macros.ts:1`, `index.ts:6167/6908/7965/13540`,
      `state.ts:753,295`, `scripts/validate.ts:971-1009`
- [x] Cluster A — §5.2 (58 REQs / 37 rows): 36 builder-side, 3 finding:F-P7b-9 (P2)
- [x] Cluster B — journal and campaign memory (15 / 4): finding:F-P7b-1 (P1)
- [x] Cluster C — synthesis engine (65 / 18): finding:F-P7b-3 (P1), F-P7b-7 (P2)
- [x] Cluster D — prompt composition and section tokens (12 / 4): finding:F-P7b-8 (P2)
- [x] Cluster E — lore, macros, suggestions, scenes (39 / 13): F-P7b-2, F-P7b-4,
      F-P7b-5, F-P7b-6 (all P1)
- [x] Cited harnesses opened; exercise recorded from `test("...")` titles
- [x] 189 REQ verdicts + 16-row behaviour table + five cluster verdicts recorded

## Phase 2 — Spec side (citation resolution)

- [x] Every `_Check:_` citation resolved with the Q7/D97 method
- [x] Citation kind classified; nine findings filed for unexercised `Automated`
      tokens whose behaviour is server-side
- [x] Bucket and verdict columns filled for all 189 rows
- [x] Coverage register unchanged (no REQ body and no bucket changed)

## Phase 3 — Triage, registers, roadmap, artefacts

- [x] Triage: 0 P0, 6 P1, 3 P2 — all scheduled
- [x] `spec/audit/review-register.md` Scheduled-roadmap rows (F-P7b-1…9)
- [x] `ROADMAP.md`: sweep section → chunk P8 + closing M1 re-run; new
      §5.2/§5.8 assertion repair section
- [x] `CHANGELOG.md` dated heading
- [x] Sweep worklist: status table, D91–D100, tables, findings
- [x] `aar.md` with `LOOP PAUSED`
- [x] Verification table un-piped (below)
- [ ] One commit via `npm run session:close`; no push

## Verification

- [x] `npm run assemble` — exit 0
- [x] `npm run check:fast` — `check:fast: PASS`
- [x] `npm run check` — `check: PASS`
- [x] `npm --prefix holonovel run test:all` — 56/56 PASS
- [x] `check-registers:strict`, `check-roadmap`, `check-loop-artifacts` — PASS
- [x] `npm run build-order` — PASS
