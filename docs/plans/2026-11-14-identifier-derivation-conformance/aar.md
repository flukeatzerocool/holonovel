# AAR — Identifier-derivation conformance (2026-11-15)

Plan: `plan.md` v3 (`sha256 556572a6…` at stamp) · Tasks: `tasks.md`
Review: cold pass + one targeted verification (`plan.cold/report.md`,
`plan.cold/rereview.md`, `plan.cold/verify.md`)

## What was supposed to happen

Make §7.1's underscore role marker and §7.1a's reserved-stem and 240-character
rules true of the code, and put the slug rule under a `REQ` so the coverage
audit can see it.

## What happened

Both rules are implemented and evidenced.

- `deriveAnchor` strips an underscore role marker (whitespace-opened,
  non-word-closed) and leaves mid-token underscores alone.
- `holonovel/src/core/slug.ts` implements `deriveSlug` and `fitSlug` under
  `REQ-659`; five derivation sites delegate to it, and pack admission refuses
  what it must not rewrite.
- `REQ-659` is registered in four places (§5.1 body, §5.1 map row, Appendix E
  manifest, Appendix F `T787`) and cited from §7.1a.
- `F-U3-1` and `F-U3-2` are `Resolved`; the roadmap section is gone.

## Baseline and final gate evidence

| Gate | Baseline (pre-change) | Final |
|---|---|---|
| `npm run validate:sdd` | 0 errors, 296 warnings | 0 errors, 296 warnings (normalized warning set identical) |
| `check-registers -- --strict` | PASS | PASS |
| `check-roadmap` | OK, 7 sections | OK, 6 sections |
| `check:fast` | PASS (41/0) | PASS (41/0) |
| `build-order` | — | exit 0 (full `check`: 0 errors, 296 warnings; version advanced to 2026.11.15) |
| `session:close` | — | commit 724a27b (one spec-touching commit) |

`REQ-659` reads `bucket C` in `spec/audit/req-coverage.md:616` (evidenced by
`T787`). Harness runs: `test-output-contracts` → 581 passed, 0 failed.

## Findings

- **F1 — the plan's first anchor expectation was wrong (fixed in review).**
  `anchors.ts:21` deletes underscores, so `set_active_state` derives
  `setactivestate`; asserting `set-active-state` would have failed the harness.
  Corrected before execution; the implementer never wrote the wrong assertion.
- **F2 — the plan's comma-case expectation was wrong (fixed in review).**
  `_GM only_, open the door` derives `open-the-door`; the plan said `the-door`.
  Replaced with `_GM only_, The Door`. Mechanically verified before execution.
- **F3 — `build-order`'s full-only gates self-skip rather than fail (closed).**
  `check-container-image.ts:42-47` exits 0 when docker is absent; bar 8 and
  step 14 now treat `build-order`'s exit status as the authority and copy a
  skip notice verbatim. No Unknown is recorded for a gate that never failed.
- **F4 — no second admission site exists (closed by enumeration).**
  `grep -rn 'novels.*\.json' holonovel/src` returns 20 sites: five derivation
  paths, the admission target and its suffix probe, and reads/checks/deletes
  that use an existing slug. `manage_archive (action: import)` restores into the
  active Novel (`state.saveNovel(novel)` at `index.ts:13541`), and
  `seedStarterNovel` copies a packaged `content/<name>.json` asset that must
  exist by name — so neither chooses a state path from free text. **P3,
  record-and-close**: the starter seeder is not a derivation site because its
  input is a packaged filename, not a name.
- **F5 — slug identity depends on the data directory (documented).**
  §7.1a caps the *full state path*, so the same name can yield a different slug
  on a machine with a longer `DATA_DIR`, and a pack legal on the exporting
  machine can be refused on a receiver with a longer path. This is the stated
  contract (D10), not a defect. **P3, record-and-close** with the predicate
  `fitSlug` measures `path.join(stateDir, "novels", slug + ext)`; a future spec
  clarification would be a ROADMAP candidate, not an AAR recommendation.
- **F6 — the admission refusal is exercised end-to-end (satisfied).**
  A bare Novel JSON (no integrity envelope) reaches the slug checks, so `T787`
  installs `{"slug":"con"}` and a 260-character slug from the inbox and asserts
  `[INVALID_INPUT]` for both.
- **F7 — register lead sentence carried two roadmap citations (closed).**
  Split so `F-U3-3`/`F-U3-4` keep the §7.3a pointer.

## Verification quality

Two cold passes and one targeted verification were independent of the authoring
context; per-stage freshness was not available (nesting prohibited), recorded as
C-2 at stamp time. Every corrected expectation was additionally checked against
a prototype of the transform (14 assertions) before execution. The harness is
the authority for behaviour: `T236` (anchors) and `T787` (slugs, ceiling,
cross-directory, admission round-trip).

## Rework and cost

One review cycle (FAILED) plus one cap-limited re-review and one targeted
verification. The date rolled to 2026-11-15 mid-session, so the CHANGELOG entry
and the CalVer bump are dated 2026-11-15 while the increment directory keeps its
session-start name (2026-11-14). No execution rework: typecheck and the harness passed on the
first run after the code landed; the only mid-build correction was trimming the
`REQ-659` body from 805 to 780 characters to clear the 800-character limit.

## Outcome against the done bar

Bars 1–7 met. Bar 8 is met: `assemble`, `validate` (0 errors, baseline warning
set), `check-registers --strict`, `check-roadmap`, `build-order`, and
`check:fast` all pass. Bar 9 is this token.

## Action items

None. F4 and F5 are record-and-close P3s with their predicates named; no P0,
P1, or P2 remains. The two open roadmap items stay as they were (§7.3a
documentation, harness test-ID hygiene, anchor repoint, loop-gate re-measurement,
U4 sweep chunk).

LOOP PAUSED
