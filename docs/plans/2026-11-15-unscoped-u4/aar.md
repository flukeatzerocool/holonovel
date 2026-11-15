# AAR — U4: verification workflows and CI

Increment: `docs/plans/2026-11-15-unscoped-u4/` · session date 2026-11-15 ·
HEAD at start `5aa2e64`.

## What was supposed to happen

Close chunk U4 of the unscoped-surface review program: 52 verdict rows over
§8 (18), the 22 gate rows, the 10 harness rows, and the 2 CI jobs; every
finding terminally dispositioned; P0 prose fixed in-session; everything else
scheduled; the program record advanced; gates green.

## What happened

- **Rows:** 52 of 52 (`grep -cE '^\| [0-9]+ \|' review.md` → 52), matching the
  plan's surface inventory exactly (18 + 22 + 10 + 2).
- **Candidates:** 13 of 13 resolved. C-9, C-10, C-11, C-12, and C-13 resolved to
  `holds` or `builder-side` with the predicate recorded; C-1…C-8 produced the
  seven findings.
- **Findings:** 7 — 2 P0 (fixed), 3 P1 (scheduled), 2 P2 (scheduled).
- **Fixes:** two §8 prose corrections (F-U4-2, F-U4-3). `npm run assemble` and
  `npm run validate:sdd` stayed at 0 errors / 296 warnings with zero §8 sites.
- **No code, harness, gate, or CI change**, as `D3` bounded. The three P1s and two
  P2s are on `ROADMAP.md` in admission-rule shape.
- **Program record:** `worklist.md` U4 row closed with its exit evidence; the
  third exit-evidence clause amended because it named a command list §8 does not
  contain; the sweep trigger now names U5.
- **Register:** two `Resolved` rows and five `Scheduled-roadmap` rows under one
  dated `### 2026-11-15 U4 verification workflows` heading each.

## What went right

- The plan's row budget held exactly: 52 rows, no orphan surface, no double
  count. The split fence was never needed.
- Every finding rests on a `file:line` predicate that was re-read before it was
  written down. The flagship (F-U4-5) is a one-line predicate — a literal `true`
  and a 31-family list against 84 REQ bodies — not a gate message.
- The cold pass earned its cost: it caught two wrong counts (84 not 82; 15 CI
  steps not 12) that would otherwise have been written into the register.

## What went wrong

- Three of the plan's counts were wrong on first assertion — the §5.12 body
  count, the CI step count, and the CI composite count. The last needed a direct
  `run:` enumeration before it held. The lesson is in the plan's own resolutions:
  count by enumeration, not by assertion.
- The plan-review cap forced a judgment call: the terminal token comes from a
  targeted check of the prior findings, not a third full sweep. That is recorded
  as a stamp condition, not presented as a fresh sweep.
- `test-loop-artifacts.ts` declares `[informational]` while exiting 1 on failure.
  The script-discipline gate does not catch that pairing; it is now F-U4-6.

## Findings and dispositions

| ID | Severity | Disposition |
|---|---|---|
| F-U4-2 (G2 check token) | P0 | Fixed in the increment; register `Resolved` |
| F-U4-3 (G4 test_n convention) | P0 | Fixed in the increment; register `Resolved` |
| F-U4-4 (server suite unwired) | P1 | `Scheduled-roadmap` — *Verification-surface reachability (P1)* |
| F-U4-5 (G7 cannot fail) | P1 | `Scheduled-roadmap` — *G7 attestation predicate (P1)* |
| F-U4-6 (two orphan harnesses) | P1 | `Scheduled-roadmap` — *Verification-surface reachability (P1)* |
| F-U4-1 (evidence record fields) | P2 | `Scheduled-roadmap` — *Verification evidence record and the CI-manifest split (P2)* |
| F-U4-7 (CI wider than manifest) | P2 | `Scheduled-roadmap` — same section |

No finding is left open; no P0 remains unfixed; no `Deferred-by-user` was
required.

## Delta class

Minor. Two prose sentences in §8, one assembled-artifact regeneration, one
register pair, three roadmap sections, one worklist amendment, one changelog
entry. No runtime, gate, manifest, CI, or harness change; no fingerprint-bearing
section (§7.7) touched, so `contract-fingerprints.ts` is unchanged and
`build-order` is not required.

## Gate results

| Gate | Result |
|---|---|
| `npm run assemble` | exit 0 — wrote `holonovel.md` and `holonovel/holonovel.md`, updated the build-phase-map hash |
| `npm run validate:sdd` | exit 0 — 0 error(s), 296 warning(s) |
| `npm run check-registers -- --strict` | exit 0 — registers structurally clean |
| `npm run check-roadmap` | exit 0 — admission rule satisfied, 8 sections |
| `npm run check-fingerprint-sync` | exit 0 (run in the close's fast suite) |
| `npm run build-order` | not run — no §5 body or §7.7 edit (`D4`) |
| `npm run check-guarded-rule-change` | exit 0 — negative confirmation (no Appendix M + validator co-change) |
| `npm run check:fast` | exit 0 — 41 passed, 0 failed, `check:fast: PASS` |
| `npm run session:close` | this increment's close |

## Verification quality

- The two P0 fixes were verified twice: by the assembled-spec regeneration and by
  a full `validate:sdd` whose warning count did not move (296 → 296).
- `grep -c 'npm run' spec/05-verification.md` → 0 remains true after the edits, so
  the amended exit-evidence clause still rests on its predicate.
- The 52-row count is reproducible from `review.md` alone; the surface inventory
  in `plan.md` is the budget it is measured against.

## Loop status

LOOP PAUSED
