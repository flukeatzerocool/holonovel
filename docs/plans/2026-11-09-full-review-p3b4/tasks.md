# Tasks — Full-review sweep, chunk P3b-4 (§5.6 state surfaces and fingerprinting)

Derived from `plan.md` (same directory). Check an item only when its evidence is
recorded in `worklist.md` or the AAR. Done bar is `plan.md` § Done bar.

## Phase 0 — Baseline

- [ ] T0.1 `npm run check:fast` un-piped; record exit and trailing line.
- [ ] T0.2 `npm run check` un-piped; record error count.
- [ ] T0.3 `npm --prefix holonovel run test:all`; record per-harness summary and
      exit (must include `test-fingerprints`, `test-limits`, `test-persistence`,
      `test-persistence-guardrails`, `test-narrative`, `test-output-contracts`,
      `test-backfill`, `test-tool-surface`; `test-package-manifest` is a root
      gate inside `check:fast`/`check`).
- [ ] T0.4 `git status --porcelain` shows only this increment's directory;
      record `git rev-parse --short HEAD`.
- [ ] T0.5 `git check-ignore -v docs/plans/2026-11-09-full-review-p3b4/` returns
      nothing.
- [ ] T0.6 Record D36–D43 (Q1–Q8) in the sweep `worklist.md`.
- [ ] T0.7 Record the plan-gate preflight evidence sidecar at its existing
      `<plan-gate state dir>/plan.evidence.json` path (outside the increment
      directory).
- [ ] T0.8 Re-derive 67 REQs / 15 families / partition 17+16+14+20 and the
      bucket per family; reconcile any mismatch in the worklist.

## Phase 1 — Code side (read-only)

- [ ] T1.1 Enumerate the surface; record `file:line` anchors for every named
      action, resource, `spec_health` field, drift block, and fingerprint path.
- [ ] T1.2 Cluster A review (fingerprinting and rebuild: 044, 302, 065, 313,
      314) — findings batched, predicates recorded.
- [ ] T1.3 Cluster B review (continuity and world reactivity: 232, 233, 236,
      237).
- [ ] T1.4 Cluster C review (durability and notes: 239, 241, 242, 285).
- [ ] T1.5 Cluster D review (codex and provenance: 321, 332).
- [ ] T1.6 Open every cited harness and confirm the assertion matches the REQ
      text; classify `T17`, `T52`, `T346`, `T497`, `T358`, `T270` (EV9) by kind.
- [ ] T1.7 Verify the checkpoint alias (EV13) has one dispatch contract.
- [ ] T1.8 Record 67 per-REQ verdicts plus 4 cluster verdict rows.

## Phase 2 — Spec side (citation resolution)

- [ ] T2.1 Resolve each REQ's own `_Check:_`; inherit family citations where
      absent; bucket from the family row.
- [ ] T2.2 Classify citation kind (Automated / Manual / Gate / scenario) before
      counting a missing harness.
- [ ] T2.3 Treat an `Automated` token with no exercising harness as a finding;
      do not raise findings from `check:conformance -- --dedicated` output alone.
- [ ] T2.4 Fill bucket and verdict columns for all 67 rows.

## Phase 3 — Triage, registers, roadmap, artefacts

- [ ] T3.1 Triage findings P0/P1/P2/P3 per Q2; apply the Phase 3 guardrails
      (sibling-contract check, Appendix M limits, fingerprint regeneration).
- [ ] T3.2 Write `spec/audit/review-register.md` rows under the disposition
      sections; every `Scheduled-roadmap` row names a `ROADMAP.md` destination.
- [ ] T3.3 Update `ROADMAP.md` sweep bullets to P4–P8/M1 and advance the
      trigger to chunk P4; add one remediation section only when triage
      schedules findings.
- [ ] T3.4 Add the `CHANGELOG.md` dated heading and bullets.
- [ ] T3.5 Replace the provisional `aar.md`; update the worklist status table.
- [ ] T3.6 Run the exit evidence un-piped (`assemble`, `check:fast`, `check`,
      `check-roadmap`, `check-registers --strict`, `check-loop-artifacts`,
      `build-order`, server suite).
- [ ] T3.7 Commit via `npm run session:close`; no push.
