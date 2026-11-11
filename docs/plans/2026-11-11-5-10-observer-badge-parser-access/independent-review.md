# Independent review — §5.10 observer badge parser access

Cold passes run in fresh subagent contexts with no authoring conversation.
Standard depth: one cold pass (five stages) plus one diff re-review.

- Pass A artifact: `plan.md` sha256 `57e69f2e…481e64` (first draft)
- Pass B artifact: `plan.md` sha256 `4d6a6f5b…356dd6` (revised draft)
- Evidence sidecar: `~/.local/state/opencode/plans/fe586f0907cda9bed04d391d454275b4a14bc3e300047c43f32dd854d4f08ed4/plan.evidence.json`
- Reviewer: cold `review` subagent, stages 1–5, 26 reads of a 40 budget
- Re-review: cold `review` subagent, 10-read budget

## Pass A verdict — `independent-review FAILED.`

Blockers:

- **B-1** REQ-366b was claimed closed while `run_command (action: resolve)`
  (`holonovel/src/index.ts:4814-4819`) and `visibility`/`audibility` (`:4787`)
  still call `requireNotObserver()`. Resolving the register entry and adding
  REQ-366b to T643's REQ column would record coverage the code does not
  provide.
- **B-2** Admitting the observer contradicts REQ-309b's "sole exception"
  wording (`spec/02-requirements.md:3415`), which the plan neither edited nor
  listed as stale.

Majors:

- **M-1** Two §6 grep rows could never return `1` (pinned prose did not contain
  the searched string).
- **M-2** The blast radius named a nonexistent budget path
  (`holonovel/spec/audit/tool-surface-budget.json`) and treated
  `surface-budget --write` as conditional although the description edit moves
  `tools_list_bytes`.
- **M-3** The T643 row claimed an observer `i` assertion the harness window did
  not make.
- **M-4** `help`/`verbs` under the observer render the GM catalogue on a
  ruleset-bound Novel while the Player is refused; the plan examined only the
  Player refusal.

Minors: badge-reset line drifted (`:503` → `:506`); the `saveNovel` "minus 3"
had no recorded baseline; the session-scoped-mode claim cited a code comment
rather than REQ-197c; T353's REQ column was left unstated.

## Revision

The plan was revised wholesale: the REQ-366b claim narrowed to its parser clause
with the resolve/resource remainder scheduled as F-5.12-1 and a new §5.12
roadmap section; REQ-309b rewritten with a pinned draft; grep patterns pinned to
shipped prose; the correct budget baseline named and `--write` made
unconditional; `i` asserted in the T643 window; the observer `help` asymmetry
recorded as a deliberate decision grounded in REQ-305; the minors fixed.

## Pass B (diff re-review) verdict

| Prior finding | Status | Evidence |
|---|---|---|
| B-1 | Resolved | Parser-clause scope, F-5.12-1 scheduled, T643 REQ column unchanged |
| B-2 | Resolved | REQ-309b exception clause pinned; body measured 795 with newline |
| M-2 | Resolved | Correct baseline path; `--write` unconditional |
| M-3 | Resolved | `i` in both the row and the window |
| M-4 | Resolved | REQ-305 quote verified at `spec/02-requirements.md:1270` |
| Minors | Resolved | `:506`; 193 → 190 baseline; REQ-197c cited |

Remaining Major raised by the re-review: the REQ-196a grep pattern was already
present in REQ-309h, so `grep -c` would return `2`. Fixed after the pass by
anchoring the pattern to the unique `On a ruleset-free Novel the parser SHALL
accept …` prefix. The re-review also flagged a measurement-basis mismatch (fix:
both drafts now reported newline-inclusive), an unreachable/self-defeating
REQ-309b fallback (replaced), a "five cells" miscount (now six), and a missing
T353 title token (now required).

Verdict line from the re-review: `independent-review passed.` — conditional on
correcting the Major on the REQ-196a grep row before Phase 6. That correction
is applied in the revised artifact; the condition is recorded for
`build-review` §6 rather than re-audited, per the condition-only amendment rule.

## Residual unknowns

- The anchor unresolved-set comparison (in-plan Phase 5 step).
- The description budget after the edit (in-plan `tool-definitions-lint`).
- `check-registers:strict` acceptance of the new dated resolved group (in-plan).
- Whether `sed -n 3415p` remains the REQ-309b body line after the edit
  (in-plan re-grep, Phase 0).

## Amendment confirmation (same cold reviewer session)

After the condition-only amendments (grep-row anchor, single measurement basis,
REQ-309b over-limit fallback, six-cell correction, T353 title token), the same
cold reviewer re-read the final artifact and confirmed no other substantive
change and that the verdict stands:

Reviewed plan sha256: d5abe92cf8a31285ae4dac6af6eaf17df4c7475129f362288d5a86f17d31c26c

`independent-review passed.`

Machine-readable binding, transcribed from the reviewer's confirmation above
(the gate requires this exact form):
Plan sha256: d5abe92cf8a31285ae4dac6af6eaf17df4c7475129f362288d5a86f17d31c26c
