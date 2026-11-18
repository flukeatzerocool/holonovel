# AAR — Roadmap drain 11: REQ evidence linkage closed

AAR: SUCCESS — the linkage check is error-mode behind a 46-row reviewed baseline, `T253` is
asserted, `T87` is reconciled, and ROADMAP item 3 is retired with all gates green.

## 1. What was supposed to happen

The plan (`plan.md`, revision 3) had one done bar: `T253` carries an asserting site with a
recorded negative probe; `T87` no longer contradicts REQ-100a; the baseline holds 46 reviewed
per-row dispositions; `validate` is error-mode with `0 unbaselined`; ROADMAP item 3 is retired;
registers agree; `check:fast` green; `aar.md` ends `LOOP PAUSED`; one commit.

Intended scope: one increment, five phases (P1 dry run + dispositions, P2 `T253`, P3 `T87`
reconciliation, P4 baseline + error mode, P5 registers + gates). Explicit assumptions, all
recorded in the plan: only one residue row is assertable from a committed artifact; the rest are
live-server, build-time, Pattern-Buffer or operator obligations; the coverage register gains
`T253` in P2 and no spec-hash line (so `assemble` cannot re-stale it).

## 2. What happened

Every phase completed in order; both delta amendments were recorded before the dependent step.

| Phase | Result | Evidence |
|---|---|---|
| P1 | dry run + 47-row disposition table | `validate` → `0 error(s)`, `47 finding(s)`; corpus 47 rows; one `@section evidence`; 47 probes in `dispositions.md` |
| P2 | `checkEvidenceRecordContract` (T253) | `PASS: Evidence record field contract (T253)`; findings 47 → 46; register rewritten, cell `S22` → `T253, S22` |
| P3 | T87 row reconciled | `assemble`; `holonovel.md` 1-line delta + phase-map hash |
| P4 | baseline + error mode | `REQ evidence linkage: 46 baselined, 0 unbaselined finding(s)`; four negative probes; `test:validators` 95 passed |
| P5 | registers + gates + close | ROADMAP item 3 retired; review-register close; AGENTS flag doc; corpus deleted; `check:fast` PASS |

**Deviations (both amended in `plan.md`).**
1. The coverage-register diff is `S22` → `T253, S22`, not `S22, T253`: `renderCoverageRegister`
   emits `exercisedTests.join(", ")` in collection order (`scripts/validate.ts:2193`). Text-only
   expectation correction.
2. `holonovel/src/generated/g7-attestation.ts` was a blast-radius omission: the T87 edit moves
   the assembled-spec hash and the G7 generator embeds it as `SPEC_HASH`. `check-g7-attestation`
   reddened; the sanctioned generator changed exactly one line.

**Loop closure.** plan-review passed (stamp `56c54610…`, independence fresh) → build-review
passed → executed → gates green → feedback routed (this AAR + one `SK` record).

**Gate outcomes.**

| Gate | Token | Verdict |
|---|---|---|
| plan-review | `plan-review passed.` | passed (after 2 failed cold passes, both fixed) |
| independent-review | `independent-review passed.` (r3) | passed |
| build-review | `build-review passed.` | passed |
| spec-review | not run (no spec-review request) | n/a |
| proofread | `npm run check` not run; `validate` proofread warnings 305 vs register 293 | see Finding F-3 |

## 3. What went right

- The cold pass earned its cost: B1 was a real execution contradiction (register staleness in P2
  versus regeneration in P5) that would have produced a red `validate` in three phases. It was
  caught before the first edit.
- `M4` was also real: the revision-2 rewrite of clause (a) dropped the blank-line tolerance and
  would have failed against the live `@section evidence` block. The plan's own acceptance line
  caught it only because the reviewer read the artefact.
- The disposition table is machine-traceable: the baseline's 46 `class`/`evidence` pairs were
  transcribed from `dispositions.md` by script, so the two artefacts cannot disagree.
- Fail-closed behaviour held under probe on every path: unbaselined, stale, invalid class,
  `no-row`. The `no-row` probe proved the important property — a verdict other than
  `automated-unexercised` cannot be waived.
- Register determinism verified by hash equality across two regeneration runs.

## 4. What went wrong

- **Plan predictions about rendered output were written from the artefact rather than the
  renderer.** The `S22, T253` ordering guess was wrong; the rule is visible in
  `renderCoverageRegister`. Cost: one delta amendment.
- **Blast radius missed a generated artifact.** The G7 attestation embeds the assembled-spec
  hash, so any Appendix edit re-stales it. This is the second time a generated hash constant was
  discovered mid-increment (the phase-map hash was anticipated; this one was not). Cost: one
  `check:fast` red run and one regeneration.
- **The plan-review condition-only path and build-review §0 disagree.** Fixing M4/N8 as a
  condition-only amendment left the stamp pointing at a report ending `independent-review
  FAILED.`, and build-review refuses to proceed without a passing token in the cited report.
  Resolved by a third, targeted cold dispatch — correct, but the two skills' contracts should
  not require it. Recorded as `SK-28`.
- **`warnings` dropped 351 → 305** when 46 findings moved out of the warning count. Correct, but
  a large visible number change that a reader could mistake for deleted checks.

## 5. Session performance

- **Outcome vs done bar.** All nine clauses hold. The item closes on its own stated trigger
  rather than being drained one row at a time; 46 rows are ratified with a class and a probe, not
  silently suppressed.
- **Scope adherence.** No out-of-plan work. Two amendments, both evidence-driven. The
  `holonovel/src/generated` edit is a generated constant, not behavioural change.
- **Verification quality.** Every new predicate has a negative probe. The one soft spot is that
  `T253`'s exercised-ID status comes from its own message literals, so the count drop is not
  behavioural proof; P2 recorded reachability plus the probe as the real evidence.
- **Rework.** Two failed cold passes (11 findings, then 2) before a clean token — expected cost
  for a standard-depth plan that changes gate semantics; no thrash in the code.
- **Cost.** Roughly 120 tool calls: ~40 research/evidence reads while drafting, 3 delegated
  reviews, ~35 execution commands, ~15 register/gate reads. Two `check:fast` runs (one red on the
  G7 constant, one green).
- **User intervention.** One: "execute plan". No corrections.

## 6. Findings

- **F-1 — the plan-review/build-review cold-token contract gap (process).** Blameless: a
  condition-only amendment is sanctioned by plan-review but leaves no passing report for
  build-review §0 to read. A second, related gap surfaced at the build marker: `mark-build`
  refused the cold report until it carried a `Plan sha256:` binding line (second instance of
  SK-27). Disposition: `SK-28` appended for the first; the binding line was added to
  `review-r3.md` and the plan re-stamped. No project change.
- **F-2 — generated hash constants are not in the dependency map (process, P3).** The phase-map
  hash is anticipated; the G7 `SPEC_HASH` is not. A one-line note in the G7 generator's header
  already exists ("regenerated when §5.12 or the coverage register moves") — the trigger is
  narrower than reality (any spec edit moves it). Disposition: record-and-close; the gate caught
  it and the fix is one command.
- **F-3 — proofread register count versus live warnings (P3, informational).** The register
  records 293 proofread warnings; `validate` reports 305 total warnings. The proofread check
  compares only proofread-class warnings and passes, but the two numbers invite confusion.
  Disposition: record-and-close; no defect demonstrated.
- **F-4 — the baseline's `spec-conflict` class is declared but unused (P3).** Kept because the
  class set is the contract for future rows (a row can be flagged as contradicting its REQ before
  it is reconciled). Disposition: record-and-close.

No project action items. Nothing scheduled on ROADMAP; the next plan comes from the roadmap or a
direct request.

**Skill findings.** One row appended (`SK-28`). Also observed, already registered and not
duplicated: the `changelog-before-commit` miss is the fourth instance of SK-18/SK-24/SK-26.

## 7. Invocation audit

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `build-review` | yes | routed |
| `after-action-report` | yes | routed |
| `changelog-before-commit` | no | miss (SK-26 covers the gap; entry authored as the AAR block) |
| `independent-review` (via subagent) | yes | routed |

Invocation: 6 expected, 5 loaded, 1 miss.

## Changelog entry

**Title:** REQ evidence linkage closed: T253 asserted, T87 reconciled, 46 rows ratified

**Summary:** The linkage queue closes on its own stated trigger instead of another three-row chunk. `T253` gains a real asserting site on the `@section evidence` field contract, `T87`'s Appendix F row is reconciled with REQ-100a's no-threshold rule, and the remaining 46 rows carry a reviewed disposition class and a measured evidence string in a new baseline the check now enforces in error mode. ROADMAP item 3 is retired.

- `scripts/lib/req-checks.ts`: `checkEvidenceRecordContract` parses each `@section evidence` record (six exact labels, canonical workflow token, ISO timestamp, `pass`/`fail`, sub-check enumeration); `diffLinkageBaseline` keys dispositions by REQ and T-ID and refuses to suppress any verdict other than `automated-unexercised`
- `scripts/validate.ts`: the REQ evidence-linkage check moves from warnings to errors — unbaselined finding, stale entry, unknown class, empty evidence, duplicate key, drifted `classes` header, or a missing file fails `validate`; `--write-linkage-baseline` regenerates deterministically and writes new keys as `unclassified` so they fail until dispositioned
- `spec/audit/evidence-linkage-baseline.json`: 46 reviewed entries (`build-time` 22, `server-drill` 14, `pattern-buffer-gap` 6, `operator` 4), each transcribed from the increment's P1 probe table
- `spec/appendices-reference.md`: the `T87` row loses its "query latency ≤ 1 second" clause, which REQ-100a forbids; the cold-start tier clause and the recording clauses stay
- `ROADMAP.md` item 3 retires; the review register closes its Scheduled-roadmap subsection and records two Resolved findings; the coverage register gains `T253`; `AGENTS.md` documents the new flag; the linkage corpus and its flag are retired
- Five negative probes prove each path: a deleted `Timestamp` field, a removed baseline entry, a bogus key, an `unclassified` class, and a synthetic `no-row` citation
- `holonovel/src/generated/g7-attestation.ts` regenerates its `SPEC_HASH` after the spec edit; `check:fast` 46/46, `test:validators` 95/95

LOOP PAUSED
