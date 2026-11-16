# After-action report — REQ evidence linkage (P1), increment 1

Covers the descoped increment: a report-only check that a REQ's `_Check:_`
citation lands on evidence its Appendix F row kind admits.

## What was supposed to happen

Execute `plan.md` (self-stamped with a recorded risk acceptance): P1 the
kind-carrying parser and a REQ-body memo, P2 the pure functions plus
`CHECK_MARKERS`, P3 seven named cases, P4 report-only wiring, P5 `corpus.md` and
the register subsection, P6 `AGENTS.md`, `CHANGELOG.md`, `check:fast`, one commit.
Done bar: 122 findings reported report-only, 72 tests, generated corpus,
register row, green fast gate, one commit, this AAR at `LOOP PAUSED`.

## What happened

| Phase | Outcome |
|---|---|
| P1 | `parseAppendixFTestText` returns `{kind, desc}`; `:1723-1725` reads `.desc`; `:2634` keeps `.keys()`; `getReqBodies` memo added and used at `:2054` |
| P2 | `CHECK_MARKERS`, `LinkageFinding`, `extractCheckCitations`, `checkReqEvidenceLinkage` appended to `req-checks.ts`; both inline marker pairs (`:183`, `:2080`) replaced |
| P3 | Seven named cases inserted before the summary block; `72 passed, 0 failed` |
| P4 | Wiring after `checkImplCoverage`: 10 printed lines, derived summary, all 122 into `warnings`, `--write-linkage-corpus` |
| P5 | `corpus.md` generated (122 rows, byte-identical on regeneration); dated register subsection added |
| P6 | `AGENTS.md` flag sentence, `CHANGELOG.md`, `check:fast`, one commit |

## Verification

| # | Command | Result |
|---|---|---|
| V1 | `npx tsx scripts/test-req-checks.ts` | `72 passed, 0 failed`; all seven names present |
| V2 | `npm run validate` (un-piped, captured to a file) | exit 0; `exercised test IDs: 685`; buckets A 0 / B 0 / C 492 / D 0 / E 117; `REQ evidence linkage: 122 finding(s)`; exactly 10 `^WARNING: REQ-EVIDENCE ` lines; first is `WARNING: REQ-EVIDENCE REQ-002 — T18 — manual-undocumented`; final `0 error(s), 422 warning(s)` |
| V3 | `npm run check:fast`; marker-pair grep | see the gate line below; `grep -c 'includes("*Check:*")'` = 0 (baseline 2) |
| V4 | regenerate `corpus.md` and `diff` | identical; `grep -c '^\| REQ-'` = 122 |
| V5 | register heading grep; `npm run check-registers` | one dated subsection; PASS |
| V6 | `npm run check-loop-artifacts` | 0 errors |
| V7 | `spec-update-record --check` | unchanged pre-existing delta (informational) |

## Deviations from plan

- **The `T553` ROADMAP section was added in this increment**, though §4 assigned
  both `ROADMAP.md` edits to increment 2. Reason: the AAR contract requires a
  terminal disposition for every finding, and `T553` would otherwise have none.
  The same edit path was used for the false T22/T35/T103 sentence, which the new
  check proves false — leaving a known-false claim in the roadmap immediately
  after building the check that disproves it was not defensible.
- **Gate independence is `self` with a recorded risk acceptance**, not a passing
  cold pass: stage-5 readiness failed twice (see
  `plan.cold/05-readiness.md`), and the user authorized executing anyway.

## Finding triage

- **F1 (P0, process) — attempt 1 was abandoned after five failed cold passes.**
  Predicate: each readiness pass returned `independent-review FAILED.` with 2–4
  Blockers, and the findings grew rather than shrank (2 → 3 → 2 → 4). Disposition:
  descoped and re-planned; this increment is the result, and attempt 1's record is
  kept at `plan.cold/attempt-1/`.
- **F2 (P0, correctness) — a test fixture of mine contained the bare token it was
  testing for.** `decisionsText: "… must not satisfy T901."` satisfied the
  `\bT901\b` predicate, so the case failed on a correct implementation. The
  anchor was right and the fixture was wrong. Disposition: fixed in the increment.
- **F3 (P3) — my predicted sort head was wrong**: `REQ-011c` sorts between
  `REQ-002` and `REQ-012`, so a row pinning the *second* line would have failed a
  correct implementation. The plan pinned only the first line, which held.
  Disposition: record-and-close; it is the reason to pin the head, not the order.
- **F4 (P1) — the 122 findings themselves.** Disposition: `Scheduled-roadmap` —
  the `REQ evidence linkage (P1)` section's trigger is unchanged (triage to zero,
  then error-mode).
- **F5 (P2) — `T553` is defined twice and both rows are exercised.** Disposition:
  `Scheduled-roadmap` — new `Duplicate Appendix F test ID (T553) (P3)` section.
- **F6 (P2) — `ROADMAP.md` asserted that T22/T35/T103 have no asserting
  harness.** Disposition: fixed in the increment; the sentence now states the
  measured split.

## What went right

- The design critic's objection to the severity partition was correct: using
  `INTENDED_GAP_REQS` — a *source-citation* whitelist — to suppress *evidence*
  findings would have mislabelled 99 real defects as intended. Dropping the
  partition made the increment smaller and the output honest.
- Pinning the aggregate warning count (`422`) is what makes "all 122 counted, not
  10 printed" verifiable; the plan's own V2 caught the intended distinction.
- Making the corpus generated rather than transcribed turned an authorship
  question into a `diff`.

## What went wrong

- Five cold passes on attempt 1 and two on the slim plan consumed far more than
  the increment. The lesson is the one attempt 1 encoded and did not follow soon
  enough: a plan that states a rule must also state the row that observes it, or
  the next reviewer finds the gap for you.
- The `AGENTS.md` flag-count sentence had to be found by a reviewer rather than
  by me, and the marker pair existed at two sites when the plan said one.

## Outcome vs done bar

Every item holds: 122 findings reported report-only behind a unique prefix, 72
tests with seven named cases, a generated corpus that diffs clean, one dated
register subsection, `AGENTS.md` and `CHANGELOG.md` updated, `check:fast` green,
one commit, and this AAR. The bar did not include triage or error-mode, and both
remain scheduled.

LOOP PAUSED
