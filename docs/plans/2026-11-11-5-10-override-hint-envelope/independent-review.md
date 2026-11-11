# Independent review — §5.10 override hint envelope plan

Plan sha256: 3198da3381a0b989cabb9e32cf06107c8b29569442076896b4ee5650a23f7b19

Reviewer: cold review subagent (no authoring context), plan-review checklist.
Date: 2026-11-11. Artifact reviewed: `plans/2026-11-11-5-10-override-hint-envelope/plan.md`.

## Pass 1 (plan sha256 e02c3712… → 0561fddb…)

Verdict: **independent-review FAILED.** Blockers: (B1) the `:1526` retitle
duplicates T373 and T374 and deletes the only T371 carrier, orphaning REQ-324;
(B2) done bar 3 required the widened T372 assertions to fail pre-fix although
they pass. Majors: (M1) D4 misdescribed the resource's observer rule;
(M2) REQ-325c's Player-badge hint clause is unreachable and unexercised;
(M3) REQ-326d still cites T370; (M4) the server harness suite was omitted from
verification. Minors: coverage register omitted from blast radius; CHANGELOG
heading reuse; T370 appendix row claims an unimplemented help assertion;
duplicate Resolved heading.

## Pass 2 — diff re-review (plan sha256 f936af79…)

Verdict: **independent-review passed.** No Blocker remained. Two Majors open:

- **M1 — the `entities`-attribution clause was neither fixed nor reconciled,**
  yet the done bar would publish the finding Resolved. Under the reachable
  `game_master`/`none` badges a foreign-entity override still produces a hint.
- **M2 — preserved false labels were deferred to a roadmap item whose scope
  (`ROADMAP.md:249-264`) and trigger do not cover misassigned-but-present IDs,**
  and the residuals had no register disposition. REQ-326d would cite T373,
  whose only carrier was a countdown test.

## Resolution applied after pass 2

- M1 is answered by reading REQ-325c's GM clause as the hint-breadth contract
  and recording the clause tension (D4, D8); the T370 test now asserts the
  foreign-entity hint appears under `game_master`, and the Player-only filter
  is exercised on `constraints://active` by T372.
- M2 is answered by correcting the four misassigned tokens in this increment
  (`:1526`→T373/T374, `:780`→T376, `:728`→T377, `:713`→REQ-only) and recording
  REQ-324's carrierless T371 (bucket E) plus the unreachable Player hint clause
  in a `## Closed-P3` register entry.
- Both are carried as build-review conditions: C-1 (GM hint breadth pinned by
  T370 and the register reading) and C-2 (label corrections and Closed-P3
  disposition present and gate-clean).

Review coverage: five areas — plan completeness, scope/coverage, evidence
accuracy, test/verification sufficiency, register and spec-project compliance.
