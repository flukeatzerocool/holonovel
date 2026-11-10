# AAR — full-review sweep, chunk P8 and the closing M1 re-run

**Status:** complete · **Date:** 2026-11-09
**Plan:** `docs/plans/2026-11-09-full-review-p8/plan.md`
**Tracker:** `docs/plans/2026-11-09-full-review-sweep/worklist.md`

## What shipped

Chunk P8 closes the review program: 166 REQs across 113 family rows — §5.12
(84/31), §5.25 (12/12), §5.26 (21/21), §5.27 (12/12), §5.32 (8/8), §5.33
(7/7), §5.34 (4/4), §5.35 (18/18). The sweep worklist now carries a 166-row
REQ verdict table, a 19-row behaviour table, five cluster verdicts, and the
closing M1 Delta amendment. With this increment the § Remaining full-review
sweep item leaves `ROADMAP.md`.

Two findings are scheduled and one observation is closed:

1. **F-P8-1 (P1) — server-note narrative coupling is stored but never
   surfaced.** `manage_note (action: set_server)` accepts and stores a
   `narrative_tag` (`index.ts:8095`, `:8145`) and `server-notes://` serves it
   (`:12754`, `:12760`), but the briefing's Supplementary guidance section
   renders synthesis items only (`:14073`); no `serverNotes` read occurs in the
   briefing builder. The cited `T416` exercises set/list only
   (`test-backfill.ts:255`). REQ-365a, REQ-365b, REQ-365c. Scheduled under the
   new `Server-note narrative coupling (P1)` roadmap section.
2. **F-P8-2 (P2) — duplicate test IDs shadow coverage resolution.** `T408`
   titles three assertions (`test-narrative.ts:767`, `test-backfill.ts:722`,
   `test-limits.ts:403`); `T409`–`T412` are each titled twice. The register maps
   them to 13 REQs, so token presence can evidence a REQ with an unrelated
   test. Scheduled by extending the existing `Harness test-ID label hygiene`
   section.
3. **Observation (P3, closed) — stranded `scripts/validate.ts:1866` comment**
   naming the canonical §5.12 list that lives at `index.ts:325`. Recorded in
   `Closed-P3`; no action.

## Decisions and deviations

- **D101–D110** are recorded in the worklist. All open questions were adopted
  as recommended.
- **Delta amendment (execution discipline).** During Phase 1 the plan's
  assumption that "no canonical §5.12 REQ list exists" was refuted: the list is
  `SECTION_512_REQS` at `holonovel/src/index.ts:325` (31 entries, `REQ-354`
  excluded as §5.2), consumed by the `narrative_coherence` attestation at
  `:12295-12300`. The cold pass had checked only `scripts/` and the revision
  overcorrected. A delta amendment was written, independently reviewed
  (`delta review passed.`, 31 entries verified), and the plan re-stamped before
  Phase 1 resumed. No phase order, done-bar item, target, or verification
  command changed.
- **No register regeneration.** No REQ body and no bucket changed, so
  `spec/audit/req-coverage.md` is unchanged (D108).
- **REQ-593** stays bucket E: `INTENDED_GAP_REQS` (`scripts/validate.ts:1924`)
  whitelists the recall-probe contract as verifier-harness work, and the
  harness (`test-memory-recall.ts:278`, T700) exists in-distribution.

## Verification (un-piped)

| Check | Command | Result |
|---|---|---|
| Baseline | `npm run check:fast` | exit 0, `check:fast: PASS` (37/37) |
| Baseline | `npm run check` | exit 0, `check: PASS` |
| Baseline | `npm --prefix holonovel run test:all` | exit 0, 56/56 PASS |
| Assembly | `npm run assemble` | exit 0 |
| Fast gate | `npm run check:fast` | exit 0, `check:fast: PASS` (37/37) |
| Full gate | `npm run check` | exit 0, `check: PASS` |
| Server suite | `npm --prefix holonovel run test:all` | exit 0, 56/56 PASS |
| Narrative | `npm --prefix holonovel run test:narrative` | exit 0 |
| Belief | `npm --prefix holonovel run test:belief` | exit 0 |
| Identity | `npm --prefix holonovel run test:identity` | exit 0 |
| Causal | `npm --prefix holonovel run test:causal` | exit 0 |
| Perception | `npm --prefix holonovel run test:perception` | exit 0 |
| Briefing | `npm --prefix holonovel run test:briefing` | exit 0 |
| Memory and recall | `npm --prefix holonovel run test:memory-recall` | exit 0 |
| Registers | `npm run check-registers:strict` | exit 0, PASS |
| Roadmap | `npm run check-roadmap` | exit 0, 23 sections |
| Loop artifacts | `npm run check-loop-artifacts` | exit 0, PASS |
| M1 conformance | `npm run check:conformance` | exit 0, 0 bundle-dependent REQs |
| M1 FMEA | `npm run fmea` | exit 0, 1311 REQs, 0 high-severity uncovered |
| M1 graph | `npm run graph-deps` | exit 0, 1035 orphaned / 126 source-only / 95 sink-only |
| Version sync | `npm run build-order` | exit 0, version sync no-op |

## What went right

- The drafting signal held: every cited token resolved, and the real defect was
  ID reuse rather than absence. The review focused on exercise, not tokens.
- The halt/budget rule was not needed; the whole 166-row chunk closed in one
  session.
- The delta-amendment path worked: an invalidated assumption was corrected,
  independently reviewed, and re-stamped without derailing the review.

## What went wrong

- The cold pass's blocker 1 was accurate about `scripts/validate.ts:1866` but
  the revision turned it into a stronger, false claim ("no canonical list
  exists") because the reviewer's scope excluded `holonovel/src`. The lesson:
  a negative existence claim needs a repo-wide probe (`grep -r`), not a
  single-directory grep. The delta review added that probe and found the list.
- The first M1 parallel run failed on a missing archive directory (`mkdir`
  raced the `fmea` job). Re-run serially; no plan impact.

## Action items

None new. F-P8-1 and F-P8-2 are scheduled on `ROADMAP.md`; the P3 observation is
closed in the register. The coverage backlog is unchanged.

## Loop status

`LOOP PAUSED`
