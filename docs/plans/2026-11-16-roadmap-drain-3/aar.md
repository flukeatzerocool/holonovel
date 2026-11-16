# AAR — Roadmap drain 3: item 3 chunk 2

**Date:** 2026-11-16 · **Increment:** `docs/plans/2026-11-16-roadmap-drain-3`
**Outcome:** plan executed; one acceptance threshold missed and recorded (F1).

## Planned against

The plan's done bar: all 38 gate-side rows carry `name`, `re-cite`, or a scheduled
deferral; the corpus reports 99 − N with N named closures (target 38); the register and
ROADMAP record the remainder; the fast gate is green.

## What happened

- **A — predicate shipped.** `labelsFromContent` lives in `scripts/lib/req-checks.ts`
  (pure, single lexer, regex-literal aware) and admits a `test(...)` name, either argument
  of `check(...)`, and a `.push`/`console`/`return` literal inside
  `function check*(…): string[]`. `scripts/validate.ts` imports it and walks root
  `scripts/**/*.ts`; the server-harness scan is unchanged. Seven self-test cases pin the
  admitted and rejected shapes.
- **B — triage.** All 38 rows carry a verdict: 6 `closed-by-scan`, 2 `name`, 3 `re-cite`,
  16 `defer-drill`, 11 `defer-noassert` (`tasks.md`).
- **C — measured.** Corpus **91** (was 99). Coverage register regenerated, not hand-edited.
  Register and ROADMAP carry the class split; `validate` exits 0.
- **D — gates.** `test:validators` 79/0, `test:spec-tooling` 102/0, `check:fast` 46/46.

## Done bar assessment

| Bar | Result |
|---|---|
| All 38 rows carry a verdict | **Met.** |
| Corpus 99 − N, N named closures, target 38 | **Missed:** N = 8; corpus 91. The plan allowed the corpus to land above 61 with a measured residue, which is what the register now states. |
| Register and ROADMAP record the remainder | **Met.** |
| Fast gate green | **Met** (46/46, un-piped, exit 0). |

## Findings and dispositions

- **F1 — the plan over-credited the 38 gate-side citations.** Only 8 closed: 6 already
  carried an admitted label and 2 had a check that asserts the row. The other 30 are not
  evidence-bearing — 16 describe builder drills recorded in `DECISIONS.md`, 11 have no
  admitted assertion, 3 name paths that do not exist. Predicate: `tasks.md` verdict table
  plus the corpus diff (99 → 91). **Disposition:** recorded in
  `spec/audit/review-register.md` and on ROADMAP item 3; chunk 3 owns every `defer-*` row.
  This is a P1 that remains scheduled, not a new item.
- **F2 — two Appendix F rows name scripts that do not exist.** `T541` says
  `scripts/check-vendor-manifest.ts`; the file is
  `holonovel/scripts/check-vendor-manifest.ts` (path drift). `T542` names
  `scripts/check-conversion-evidence.ts`, which does not exist at all. **Disposition:**
  scheduled with chunk 3 (row repair or re-cite), recorded in the register entry.
- **F3 — a regex literal carrying quote characters desynced the lexer.** A naive
  comment/string scanner read the rest of `scripts/validate.ts` as one string, so no label
  matched; `validate.ts` yielded zero labels until the regex-literal skip was added.
  Predicate: `labelsFromContent(validate.ts)` returned `[]` before the fix and
  `T543,T544` after. **Fixed in-increment** with a regression case
  ("a regex literal containing quotes does not desync the scan").
- **F4 — reading the whole `test(...)` call admitted callback-body literals.** `T4` closed
  on a data array inside a test callback, contradicting Dec-1. Predicate: the corpus
  dropped `REQ-012 T4` without any label edit. **Fixed** by admitting only the first
  argument; `T4` is back in the corpus (correctly).
- **F5 — the cold pass's residual minors.** The `tasks.md` A1 row named `validate.ts` for a
  reader that lives in `lib/`; the done-bar clause excluded the deferral class. **Fixed**
  in the tasks table and the plan's round-3 revision.
- **F6 — test-name fixtures use synthetic IDs.** `T901`–`T910` live only inside
  `labelsFromContent("…")` arguments, which the rule does not admit, so no fixture ID
  enters the exercised set. Verified by reading the exercised set (77 T-IDs, none
  synthetic).

## Loop status

All five ROADMAP items are dispositioned: item 3 advanced (chunk 2 of 3) and remains
scheduled with its measured count; items 1, 2, 5, 7 are untouched with unfired triggers.
No finding lacks a terminal disposition.

LOOP PAUSED

## Changelog entry

**Title:** Linkage predicate admits gate labels; 8 citations close (chunk 2 of 3)

**Summary:** The REQ evidence-linkage check now sees the assertion shapes the root gates
actually emit, so a builder-side REQ can be evidenced by the check that enforces it. Eight
citations closed and the corpus fell from 99 to 91; the remaining 30 gate-side citations
are reclassified as builder drills, unasserted rows, or stale script paths, and the 61
script-less citations stay with chunk 3.

- `scripts/lib/req-checks.ts`: pure `labelsFromContent` with a single lexer that is
  regex-literal aware; admits `test(...)` names, either `check(...)` argument, and
  `.push`/`console`/`return` literals inside `function check*(…): string[]`.
- `scripts/validate.ts`: imports the reader and walks root `scripts/**/*.ts`; the server
  harness scan is unchanged.
- Named the two rows whose asserting check exists: `T543` (§5.2 coverage map) and `T544`
  (intended-gap whitelist discipline).
- `scripts/test-req-checks.ts`: seven cases pin the admitted and rejected shapes, including
  a regex literal carrying quotes and a fixture that contains code text.
- Corpus regenerated to 91; coverage register regenerated via `validate -- --write-register`.
- ROADMAP item 3 and the review register record the 8 closures, the class split, and the
  chunk-3 decision (declared gate kind vs. a T-named assertion per REQ).
