# Tasks — Full-review sweep, chunk P6b (ruleset packages and host entry points)

**Status:** complete · **Date:** 2026-11-09
**Plan:** `docs/plans/2026-11-09-full-review-p6b/plan.md`
**Tracker:** `docs/plans/2026-11-09-full-review-sweep/worklist.md`

## Phase 0 — Baseline

- [x] T0.1 Run `npm run check:fast` and `npm run check` un-piped; record exit
      status and the trailing PASS/FAIL line.
- [x] T0.2 Run `npm --prefix holonovel run test:all`; record the per-harness
      summary, including the ten ruleset-path harnesses.
- [x] T0.3 Record `git status --porcelain` and `git rev-parse --short HEAD`;
      confirm the cold-pass and sidecar directories are outside the repo.
- [x] T0.4 Confirm `git check-ignore -v docs/plans/2026-11-09-full-review-p6b/`
      returns nothing.
- [x] T0.5 Record Q1–Q9 and Q5a as D71–D80 in the sweep worklist.
- [x] T0.6 Write the plan-gate preflight evidence sidecar.
- [x] T0.7 Re-derive the 73-REQ / 50-family-row set and buckets; stop and
      re-stamp on a verified mismatch.

## Phase 1 — Code review (read-only)

- [x] T1.1 Enumerate exports, action branches, listing handlers, entry-point
      flag surfaces, and capability branches with `file:line` anchors.
- [x] T1.2 Cluster A review: package format and `RulesetManager`.
- [x] T1.3 Cluster B review: ruleset-scoped surface and `spec_health`.
- [x] T1.4 Cluster C review: host entry points and lifecycle.
- [x] T1.5 Cluster D review: Fate/Ironsworn/Forged capabilities.
- [x] T1.6 Open every cited harness; record exercise, not token presence.
- [x] T1.7 Record 73 REQ verdicts, the behaviour table, and four cluster
      verdicts.

## Phase 2 — Citation resolution

- [x] T2.1 Resolve every `*Check:*` citation for the 73 rows using the
      P2/P3b/P4/P5/P6a method.
- [x] T2.2 Classify citation kind; record `Automated` tokens with no exercising
      harness as findings.
- [x] T2.3 Fill bucket and verdict columns for all 73 rows.

## Phase 3 — Triage, registers, roadmap, artefacts

- [x] T3.1 Triage findings P0–P3 per D62; fix bounded P0s and run the
      guardrail gates.
- [x] T3.2 Write `spec/audit/review-register.md` rows per disposition.
- [x] T3.3 Update `ROADMAP.md` (sweep trigger to P7; remediation sections when
      scheduled; P0 section on a halt).
- [x] T3.4 Write the `CHANGELOG.md` dated heading and bullets.
- [x] T3.5 Update the sweep worklist status table and decisions.
- [x] T3.6 Replace the provisional AAR with the execution record and loop token.
- [x] T3.7 Run the verification table; commit per the plan's commit order.
