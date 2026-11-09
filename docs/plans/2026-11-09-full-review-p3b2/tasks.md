# Tasks — full-review sweep, chunk P3b-2 (§5.6 entities and NPCs)

**Plan:** `docs/plans/2026-11-09-full-review-p3b2/plan.md`
**Status:** draft, awaiting plan approval. Check a box only when the evidence is
recorded in the worklist or AAR.

## Phase 0 — Baseline

- [x] T1 Run `npm run check:fast` un-piped and record exit status; run
      `npm run check` once and record the full-gate baseline. Fix a red baseline
      as C0, its own commit; if it cannot be fixed, land per the plan's
      red-baseline branch.
- [x] T2 Run `npm --prefix holonovel run test:all` and record the per-harness
      summary and exit status; confirm `test-limits` (T143/REQ-129) and
      `test-briefing` are in the run.
- [x] T3 Record `git status --porcelain` (only the untracked increment directory)
      and `git rev-parse --short HEAD`.
- [x] T4 Confirm `git check-ignore -v docs/plans/2026-11-09-full-review-p3b2/`
      returns nothing.
- [x] T5 Record Q1–Q8 as D20–D27 in the sweep worklist. Do not renumber D1–D19.
- [x] T6 Record the external plan-gate preflight evidence sidecar beside the
      stamped artifact.
- [x] T7 Re-derive the 93-REQ / 30-family partition (33 + 28 + 32) and each
      family's bucket from `spec/audit/req-coverage.md`.

## Phase 1 — Code side (read-only review)

- [x] T8 Enumerate the cluster A surface with `file:line` anchors (roster,
      entity lifecycle, scene ledger, presence, knowledge gating, cardinality).
- [x] T9 Enumerate the cluster B surface with `file:line` anchors (NPC records,
      stat-block reference and rendering, `npc://` resources, NPC memory).
- [x] T10 Enumerate the cluster C surface with `file:line` anchors (personality,
      voice, signal, boundary, connection counter, briefing rendering,
      `entity://` resources).
- [x] T11 Run the read-only `code-review` pass on cluster A and batch findings.
- [x] T12 Run the read-only `code-review` pass on cluster B and batch findings.
- [x] T13 Run the read-only `code-review` pass on cluster C and batch findings.
- [x] T14 Open every cited harness and confirm it asserts the REQ contract, not
      a substring; record a finding where it is narrower.
- [x] T15 Verify entity/roster lifecycle arithmetic, undoability, and
      cardinality refusals by reading the implementation.
- [x] T16 Verify presence and knowledge gating, including empty-presence and
      unknown-entity cases.
- [x] T17 Verify NPC records, stat-block references, resources, and card
      import/export round-trips.
- [x] T18 Verify personality/voice/signal/briefing surfaces and null-omission
      behaviour.
- [x] T19 Record one verdict per REQ (93 rows) and one cluster verdict per
      cluster in the worklist.

## Phase 2 — Spec side (citation resolution)

- [x] T20 Resolve every REQ's own `_Check:_` IDs; inherit the family set when
      absent; classify citation kind before counting a missing harness.
- [x] T21 Confirm every `Automated` token appears in a harness and that the
      harness body exercises the behaviour; treat `T0nn` shadowing as
      non-evidence (F-P2-4).
- [x] T22 Fill bucket and verdict columns for all 93 rows.

## Phase 3 — Triage and write-back

- [x] T23 Triage every finding P0–P3 per D13; apply the P0 fix guardrails
      (sibling-contract check, Appendix M limits, fingerprint regeneration,
      tool-definition regeneration, full action surface).
- [x] T24 Write the review-register rows under the disposition sections.
- [x] T25 Amend `ROADMAP.md`: bullets re-scoped to P3b-3/P3b-4/P4–P8/M1;
      trigger advanced to chunk P3b-3; admission shape preserved.
- [x] T26 Add the dated `CHANGELOG.md` heading and bullets (date equals the
      CalVer date).
- [x] T27 Update the sweep worklist status table (P3b-2 closed or halted).
- [x] T28 Replace the provisional `aar.md` with the execution record and the
      earned LOOP token.
- [x] T29 Run the verification table un-piped; record exit statuses.
- [x] T30 Commit with `npm run session:close`; C0 first only if it exists. No
      push.
