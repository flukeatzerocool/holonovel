# Tasks — full-review sweep, chunk P2 (tool surface and §5.3)

Tracks execution of `plan.md`. One row per step; evidence recorded as it runs.
The chunk's review record is the 115-row table appended to
`docs/plans/2026-11-09-full-review-sweep/worklist.md`.

## Phase 0 — Baseline

- [x] P0.1 `npm run check:fast` (un-piped) → record exit/verdict
- [x] P0.2 `npm run check` (un-piped) → record exit/verdict
- [x] P0.3 `npm --prefix holonovel run test:tool-definitions` → record exit
- [x] P0.4 `npm --prefix holonovel run test:security` → record exit
- [x] P0.5 record `git status --porcelain`, `git rev-parse --short HEAD`
- [x] P0.6 confirm increment dir is trackable (`git check-ignore` returns nothing)
- [x] P0.7 record D1–D5 in the sweep worklist
- [x] P0.8 evidence sidecar beside the stored plan artifact
- [x] P0.9 re-derive the 115-REQ cluster partition

## Phase 1 — Code side (read-only review)

- [x] P1.1 enumerate surface with `file:line` anchors (registry, definitions,
      surface report, resources, prompts, `spec_health`/`manage_diagnostics`)
- [x] P1.2 cluster A review (tool surface and economy, 21 REQs)
- [x] P1.3 cluster B review (documentation and TDQS, 10 REQs)
- [x] P1.4 cluster C review (resources and UI, 13 REQs)
- [x] P1.5 cluster D review (prompts and guidance, 18 REQs)
- [x] P1.6 cluster E review (`spec_health` and diagnostics, 19 REQs)
- [x] P1.7 cluster F review (surface profiles, 15 REQs)
- [x] P1.8 cluster G review (build metadata and configuration, 19 REQs)
- [x] P1.9 gate assertion vs REQ text check per carrying gate
- [x] P1.10 advertised artifact vs canonical registry check
- [x] P1.11 record 115 per-REQ verdicts

## Phase 2 — Spec side

- [x] P2.1 resolve citations (own Check → family inheritance → harness presence)
- [x] P2.2 classify citation kind before counting a missing harness
- [x] P2.3 inspect `check:conformance -- --dedicated` output as evidence only
- [x] P2.4 fill bucket and verdict columns for all 115 rows

## Phase 3 — Triage, registers, gates

- [x] P3.1 triage findings P0–P3 per D2
- [x] P3.2 `spec/audit/review-register.md` rows
- [x] P3.3 `ROADMAP.md` trigger advanced to chunk P3
- [x] P3.4 `CHANGELOG.md` dated entry
- [x] P3.5 `tasks.md` progress and `aar.md` written with terminal token
- [x] P3.6 `npm run assemble`, `npm run check:fast`, `npm run check`,
      server harnesses, `npm run build-order`, `npm run check-loop-artifacts`
- [x] P3.7 build marker, then `npm run session:close`
