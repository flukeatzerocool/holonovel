# AAR — §5.10 hints, detail signal, vehicle traversal

Date: 2026-11-11 · Increment: `docs/plans/2026-11-11-5-10-world-model-hints-detail-vehicle/`
Plan: `plan.md` (sha256 `44c1f52f…`, cold-reviewed 3 rounds) · Guard: `build-review passed.`

## Done bar vs outcome

| # | Bar | Outcome |
|---|---|---|
| 1 | F-P6a-8/9/10 under `## Resolved — 2026-11-11 §5.10 hints, detail, and vehicles` | Met — three rows with post-change `file:line` predicates (`spec/audit/review-register.md:14-62`) |
| 2 | ROADMAP keeps only the resources/CRUD bullet; trigger closes on F-P6a-12/13/14 | Met — `check-roadmap` passes (16 sections admissible) |
| 3 | Widened T354/T240/T362 fail pre-fix and pass post-fix | Met — see Red/green evidence |
| 4 | T354 asserts violation class, literal hint, jar hint, adjacent-room hint, no-hint cases | Met |
| 5 | T362 asserts capacity, passenger movement, door block, interior map exclusion, moment, recap, briefing | Met |
| 6 | T240 asserts terse/normal/rich, override paths, `detail_level`, Player-Detail line | Met |
| 7 | Appendix F T240/T362 widened; T354 verified; `validate --sdd-strict` 0 errors | Met — 0 errors, 285 warnings (informational) |
| 8 | `assemble`, `check:fast` PASS; `check` 0 errors; `build-order` completes | Met — see verification |
| 9 | `aar.md` ends `LOOP PAUSED`; one commit via `session:close` | Met |

## Red/green evidence

| Harness | Pre-fix (new assertions only) | Post-fix |
|---|---|---|
| `test:output-contracts` | 361 passed, **7 failed** (detail terse, `detail_level`, locked-open class, exact key hint, jar read class, jar hint, adjacent-room hint) | **375 passed, 0 failed** |
| `test:backfill` | 99 passed, **4 failed** (T362 capacity, T362b door block, two cascade fixtures) | **103 passed, 0 failed** |

Two harness defects were found while turning the red tests green and fixed in the
same increment (not plan deviations): the T362 fixture read the vehicle by its
article-bearing convert name, and the exit-moment assertion carried a trailing
period the contract does not produce.

## Predicate re-audit (Phase 0.2)

- H (entry never checks capacity) was **withdrawn before implementation**: the
  parser already enforces `capacity` at `holonovel/src/world/parser.ts:823`
  (`handleEnter`). The real gap was `create_thing` never setting it; D5 was
  corrected before the first edit, matching the cold-review finding.
- A–G, I–L held at the cited lines and were fixed as planned.
- The REQ-284b example was corrected from `unlock` to `open` so it no longer
  contradicts REQ-284f and T553; T553 passes untouched.

## Gates run

- `npm run assemble` — exit 0.
- `npm run validate -- --sdd-strict` — **0 errors**, 285 warnings.
- `npm --prefix holonovel run typecheck` — exit 0.
- `npm run check-tool-definitions-sync` — in sync (37 tools) after regeneration.
- `tool-definitions-lint` — 0 violations.
- `check-tdqs-scoreboard` — PASS.
- `surface-budget` — PASS after `--write` and the DECISIONS count refresh
  (full 28,528 / standard 24,930 / small 1,180).
- `check-roadmap`, `check-registers` — PASS.
- `check:fast` — **40 passed, 0 failed**, trailing `check:fast: PASS`.
- `build-order` — exit 0; full check 0 errors, versions bumped to `2026.11.11`,
  spec markers refreshed, fingerprint propagated.
- Targeted harnesses — `test:world-remediation` 3/0, `test:adventure` 19/0,
  `test:narrative` 75/0.

## Findings and dispositions

- **P3 — proofread register drift.** The live proofreading pass reports 282
  warnings against 271 recorded. Informational; recorded here and left for the
  next full pass (`spec/audit/review-register.md` is the tracking surface when
  it becomes actionable). No action.
- **P3 — `[vehicle-entry]` recorded twice before the fix.** Re-entering a vehicle
  already occupied appended a duplicate passenger and a duplicate moment; fixed
  in this increment (idempotent entry, single moment) and covered by T362.
- **Closed-P3 — no new gate.** No check was installed; the reused gates are the
  verification set above.

## Verification commands

| Step | Command | Result |
|---|---|---|
| Targeted harnesses | `test:output-contracts`, `test:backfill`, `test:world-remediation`, `test:adventure`, `test:narrative` | see logs |
| Spec gates | `assemble`, `validate --sdd-strict` | 0 errors |
| Surface | `check-tool-definitions-sync`, `tool-definitions-lint`, `check-tdqs-scoreboard`, `surface-budget` | PASS |
| Registers | `check-registers`, `check-roadmap` | PASS |
| Fast gates | `npm run check:fast` | PASS (see below) |
| Full pipeline | `npm run build-order` | completes |

LOOP PAUSED
