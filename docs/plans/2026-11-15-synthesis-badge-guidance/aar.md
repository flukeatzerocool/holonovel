AAR: SUCCESS — four badge guidance resources ship, U6-F6 closes with its own rationale corrected, and three unchecked generated-file omissions surfaced and were fixed inside the increment.

# AAR — Badge guidance renderers (U6-F6)

## 1. What was supposed to happen

The operator asked for a plan for the next roadmap items; the plan-review gate and one
cold-pass cycle turned that into increment `2026-11-15-synthesis-badge-guidance`, approved
`plan-review passed.` with four conditions (C-1…C-4) at standard depth.

Declared done bar (`plan.md`): four guidance resources live with a passing `T791`,
REQ-022a/REQ-071b catalogues bound to it, U6-F6 `Resolved` with its superseded rationale
stated, roadmap section removed, `check:fast` + `test:all` + `build-order` green, one commit
under `session:close` with `LOOP PAUSED`.

Explicit assumptions: §5.1 is outside `DATA_SECTIONS` (no fingerprint regeneration owed);
resources do not enter the tool catalog budgets; only the tool count in
`holonovel/AGENTS.md` is gated; `T791` was free.

## 2. What happened

| Gate | Token | Verdict |
|---|---|---|
| plan-review | `plan-review passed.` | passed (after two cold failures) |
| independent-review (v1 full) | `independent-review FAILED.` | failed — 3 Blockers |
| independent-review (v2 diff) | `independent-review FAILED.` | failed — 1 Blocker |
| independent-review (v3 targeted) | `independent-review passed.` | passed |
| independent-review (A-1/A-2 delta) | `independent-review passed.` | passed (second window; first was honestly reported incomplete) |
| build-review | `build-review passed.` | passed |
| check:fast baseline → final | `45 passed, 0 failed` → PASS | passed |
| test:output-contracts | 590 passed, 0 failed | passed |
| test:all | 56 passed, 0 failed | passed |
| build-order | complete, 0 errors | passed |

Steps completed against `tasks.md`: all of Phase 0–6. Deviations were three unchecked
generated/derived files, each amended on the record rather than swept in:

- **A-1** `spec/build-phase-map.md` (assemble advances its REQ-278 hash).
- **A-3** `holonovel/src/generated/g7-attestation.ts` (its `SPEC_HASH` tracks the spec).
- **A-4** `holonovel/scripts/lib/holosuite-conformance.ts` (one line-addressed evidence
  anchor re-pointed 17487 → 17631 after the 144-line insertion).
- **A-2** a factual correction: the documented surface counts were already stale
  (43 resources / 23 templates measured vs 40 / 22 documented at HEAD), so the DECISIONS
  entry reports the drift instead of claiming the whole move as this increment's.

Loop closure: plan reviewed → executed under `build-review` → verified by the three gate
suites → feedback routed here. No `spec—improved.` outcome delta exists for this project
(server increment, not a spec-remediation loop).

## 3. What went right

- The plan's own cold pass caught three defects that would have failed in the harness
  (manifest-null voice views, self-contradicting gate order, a stripped tag the test
  required). Every one was a design-level fix, not a test relaxation.
- `build-order` caught all three generated-file omissions that the plan's file list missed.
  Nothing shipped unlisted; the gate did its job and the amendment record kept it honest.
- `check-registers` caught a structural error of mine: moving U6-F6 to Resolved *in place*
  left it under `## Scheduled-roadmap`, so the parser still classified it as scheduled. The
  entry was relocated under a `## Resolved` heading.
- T791 asserts the empty Player voice view rather than skipping it, so the product decision
  is pinned by a test (C-4).

## 4. What went wrong

- **The plan's file list omitted every artifact an authorised command writes.** Three
  separate omissions (A-1, A-3, A-4) cost a re-stamp cycle each. The plan authorised
  `assemble`, `build-order`, and the code insertion but not their file effects. This is a
  plan-authoring gap, not an execution gap: nothing was improvised, but the first pass at
  `build-order` was guaranteed to fail.
- **`test:all` failed on an evidence anchor before the anchor repair step existed in the
  plan.** Line-addressed predicates in `holosuite-conformance.ts` are a deterministic
  consequence of inserting code in `index.ts`; the plan treated `npm run build-order` as a
  check rather than as a generator-plus-check.
- **Review cost was high relative to the change.** 4 cold dispatches, 2 full failures,
  80+ reviewer reads for a four-resource increment. The first cold pass ran before my own
  self pass was finished, which is why two of its Blockers were things I had already
  queued — ordering the self pass first would have removed one dispatch.
- **A stale documented count was discovered only during execution.** `AGENTS.md` claimed
  40 resources when the server served 43; the plan inherited the stale number and had to
  correct the record mid-flight.

## 5. Session performance

- **Outcome vs done bar:** met. All four resources registered, `T791` green in both
  suites, catalogs bound, U6-F6 resolved with the corrected rationale, roadmap section
  gone, three gate suites green, one commit.
- **Scope adherence:** no out-of-scope work. OQ-1 (no tone producer), OQ-2 (player voice
  content) and OQ-3 (read-time refusal) were deliberately left out and recorded.
- **Verification quality:** strong. `T791` can fail (it did during development reasoning:
  the manifest-null path and the stripped tag were both caught before implementation).
  The 56-command suite and `build-order` are independent of the new test.
- **Rework:** three re-stamp cycles for generated files, one register relocation, one
  anchor re-point. Necessary iteration, not thrash — each was gate-visible.
- **Cost:** ~95 tool calls this session; roughly 45% review/gate, 25% implementation,
  15% spec/bookkeeping, 15% diagnosis of the three gate failures.
- **User intervention:** one question answered (review depth), one decision (how to close
  the residual gate token), one instruction (`execute plan`). No corrections of work.

## 6. Findings

Project action items: **zero**. The three generated-file omissions are closed in this
increment (amended, covered by the stamp, verified by the gates). The stale-count discovery
is closed by the DECISIONS record.

Methodology findings routed to the spec's authoring conventions: the plan-authoring
checklist should require enumerating generated artifacts produced by any gate/build command
the plan runs. Recorded as SK-15 (skill channel) because the checklist that missed it is
`plan-review`'s.

Follow-through register: this increment carries no `SR-<n>`/`PR-<n>` items. Prior-step
items from the 2026-11-15 synthesis increment remain as recorded on `ROADMAP.md`
(faction knowledge, vendor-manifest provenance, loop re-measurement); nothing new is added.

Process failure: none. `build-review` ran before the first edit, the three generated-file
amendments were recorded before commit, and no gate was bypassed.

```text
Skill findings: 2 SK records appended. Run skill-improvement-loop to triage.
```

## 7. Auto-remediation loop

Not requested; report-only.

## 8. Invocation audit

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `build-review` | yes | routed |
| `after-action-report` | yes | routed |
| `changelog-before-commit` | no | miss (same gap as SK-3; not re-recorded) |
| `code-review` | no | n/a — no diff review was requested; the increment's own harness is the review surface |

Invocation: 5 expected, 4 loaded, 1 miss.

Skill findings appended: SK-15 (`plan-review` — plan file lists omit generated artifacts),
SK-16 (`build-review`/`plan-review` — no cheap re-stamp path for mechanical execution
deltas, so `fresh` independence survives parent-verified amendments).

LOOP PAUSED
