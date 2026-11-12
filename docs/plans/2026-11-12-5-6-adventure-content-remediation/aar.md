# After-action report — §5.6 adventure content remediation

Increment: `docs/plans/2026-11-12-5-6-adventure-content-remediation/`
Plan artifact: `plan.md` sha256 `be3f4d00…` (stamped plan-review passed, fresh,
standard)
Executed: 2026-11-12

## Outcome

All twelve findings (F-P3B3-1…12) are resolved and the ROADMAP section is
removed. The gate set is green: `check:fast` 41/41, five harness suites, the
pattern buffer, root and server typecheck, `check-adventure-index`,
`check-gate-table`, `surface-budget`, and the full `check` via `build-order`.

## Evidence

| Step | Command | Result |
|---|---|---|
| Extractor + index | `npm run check-adventure-index` | PASS — index and DECISIONS table fresh |
| Adventure harness | `npm --prefix holonovel run test:adventure` | 27 passed, 0 failed |
| Output contracts | `npm --prefix holonovel run test:output-contracts` | 427 passed, 0 failed |
| Briefing | `npm --prefix holonovel run test:briefing` | 16 passed, 0 failed |
| Backfill | `npm --prefix holonovel run test:backfill` | 105 passed, 0 failed |
| Narrative | `npm --prefix holonovel run test:narrative` | 76 passed, 0 failed |
| Pattern buffer | `npm --prefix holonovel run test:pattern-buffer` | blocking failures 0 |
| Coverage register | `npm run validate -- --write-register` | 0 errors; buckets A 0 / B 0 / C 490 / E 118 |
| Tool surface | `npm run surface-budget` | PASS — full 28,663 / standard 25,065 |
| Types | `npm --prefix holonovel run typecheck` | clean |
| Fast gate | `npm run check:fast` | 41 passed, 0 failed |
| Full gate | `npm run build-order` | see Verification below |

Red baseline observed before the fixes: the pre-existing T207 empty-state
assertion failed once the shipped fixtures existed, and T305 failed because the
old synthesis counter matched every item through an empty term. Both were
captured before their fixes. The remaining new assertions were written
alongside their surface rather than strictly red-first (see Deviations).

## Condition C-1 (plan-review)

D7's `player_visible` carrier was verified: the marker is a standalone
`<!-- player_visible: true -->` comment outside the `---` block.
`src/core/adventure-provenance.ts` is untouched, so signature verification and
the REQ-096m/621a embed round-trip are unaffected; T207/T338 exercise the
Player-visible and GM-only branches, and the existing T734/T740 provenance and
embed tests stay green.

## Deviations

- **Assertion ordering (P3).** The plan promised every assertion red-first. The
  build-artifact and most server assertions were written with their
  implementation; only the two pre-existing failures were observed red. The
  product gates are green, but the plan's literal done-bar clause is not met.
  Recorded here rather than retro-attested.
- **Monster suggestion coverage.** The suggestion code path is implemented and
  the harness exercises pre-population/duplicates; the ruleset-match branch is
  not asserted in-tree because the reference harness carries no installed
  ruleset. The code path is small and shares the `rulesets.search` surface used
  by Tyy tests elsewhere. Recorded as a P3 coverage note.
- **T338's "ruleset compatibility" column.** The catalogue row is looser than
  REQ-292a; the assertion follows the REQ's field list (`genre_tags`), and the
  difference is recorded here.

## Register and roadmap

- `spec/audit/review-register.md` gains the dated resolved block; the old
  sweep section is removed.
- `ROADMAP.md` § *§5.6 adventure content remediation (P1)* is removed.
- `spec/audit/req-coverage.md` regenerated; REQ-079/132/170/229/248/249/250/292
  stay bucket C, REQ-171/172/247 stay bucket E with REQ-454 dispositions.
- `holonovel/DECISIONS.md` records D1–D4 and the generated adventure index.

## New action items

None at P0/P1. The three P3 notes above are recorded in place; no ROADMAP entry
is opened for them (each is a process or coverage observation, not a
demonstrated failure).

LOOP PAUSED
