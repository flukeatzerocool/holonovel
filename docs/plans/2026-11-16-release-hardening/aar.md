# AAR — Release hardening

**AAR: PARTIAL — P1 and P2 shipped and verified; P3 is operator- or
design-gated, and P4 waits on the publish order.**

**Date:** 2026-11-16 · Plan revision 6 · Increment
`docs/plans/2026-11-16-release-hardening`

## 1. What was supposed to happen

The plan set out four phases: P1 close the `[MISSING_PARAM]` contract, P2 make
the release state honest, P3 grow the mutation sample and run §10, P4 publish.
The done bar required `check:fast` PASS, `test:all` green with a generated
battery over every surface, zero raw exceptions, string-named resources, `status`
never presenting a dry run as a publish, `test:package-smoke` 11/11, and a
completed publish. `plan-review` passed at standard depth with one cold pass and
three delta confirmations; `build-review` passed before the first edit.

## 2. What happened

P1 and P2 executed as planned, with two execution deltas recorded in the plan.

**P1 — input contract.** `REQUIRED_PARAMS` (25 surfaces, keyed
`${tool}:${action}`, with one `unless` alternate for
`manage_countdown (action: set)`); the guard in `guardToolCall`; the `[SYSTEM]`
envelope at registration and at the MCP seam; three resource-name fallbacks. The
adversarial tier gained a generated sweep: 269 passed here, **35 failures against
the published 2026.11.8 build**. Two fixtures that had relied on the defect were
corrected (`test-narrative.ts` T56, and the T177 test itself).

**P2 — release integrity.** `dry_run`/`stopped_at` on the run record; pure
`describePublishRun`; `status` prints `last pipeline run:`; ROADMAP gains the
shared-evidence class; the review-register's dangling sentence is repaired; the
`hono` non-reachability and the CI-only container are recorded. T177's
`[AMBIGUOUS]` half was amended rather than implemented: no surface emits the
category, and the parser's multi-match path is the REQ-196e numbered prompt.

**P3 — not executed.** T1 was rescoped (see §4); T2 is an operator step by
construction. **P4 — not executed**; publication needs the operator's order.

### Gate outcomes

| Gate | Token | Verdict |
|------|-------|---------|
| plan-review | `plan-review passed.` | passed (self + cold, 5 stages) |
| independent-review | `independent-review passed.` ×4 | passed (initial, P1 delta, P2 delta, final disposition) |
| build-review | `build-review passed.` | passed |
| drift-report | not run | n/a |
| spec-review | not run | n/a |
| proofread | not run (validator proofreading ran inside `validate`: 0 errors, 427 warnings) | passed as a gate |

Evidence per phase: `check:fast` PASS (46/0); `test:all` 56/56 (174.8 s);
`test:package-smoke` 11/11; `test:pipeline` 35/35; `test:update-workflow` 22/22;
`test:g7` 4/4; `check-anchors` 17 written, 0 unresolved; the sweep 0/0/0 with no
undefined-keyed record.

## 3. What went right

- The battery discriminates. The same tier that is green here reports 35
  failures on the published build, so the check is not a tautology.
- The guard found real latent defects beyond the 22 measured: `manage_novel
  (action: rename)` produced `undefined.json`, and two fixtures depended on
  storing records under an undefined key.
- Declaring the two helpers at the end of `index.ts` kept anchor drift at 17
  lines, inside the resolver's ±40 window; one `fix-anchors` run healed it.
- The plan's `unless` provision was exercised for real by T271, and the generic
  validator absorbed it without special-casing.

## 4. What went wrong

- **P3-T1 was over-scoped at plan time.** "Grow 8 → ~30 mutants" reads like a
  parameter change; the tier's evidence is a single synthetic transcript, so
  reaching 30 means new lenses and fixtures. Padding with repeated lens seeds
  would be the exact tautology `ORACLE_DERIVED`/CR-32 excludes. The estimate,
  not the execution, was wrong.
- **Two fixture dependencies surfaced only at `test:all`.** The blast-radius
  preflight checked for config shapes, not for tool calls that omit required
  parameters. A grep for `manage_*(action: set` without a key would have found
  them before the first edit.
- **The T177 amendment pulled in a second-order regeneration** (G7), which the
  plan named only as a conditional. Fixed and recorded, but it cost a gate cycle.

## 5. Session performance

- **Outcome vs done-bar.** P1/P2 criteria hold; P3/P4 do not, by boundary not by
  failure. The plan's own done bar is therefore unmet and the loop stays open.
- **Scope adherence.** No out-of-plan surface except the two recorded deltas
  (one fixture, one generated artifact).
- **Verification quality.** Every claim in this report names a command and its
  result; the discrimination check is the strongest evidence.
- **Rework.** Three failed `test:all`-level runs (T177 rename param, T271
  alternate, T56 fixture) each produced a code or fixture correction, not a
  weakened check.
- **Cost.** Two cold-review passes plus three delta confirmations; five commits
  in P1, four in P2.
- **User intervention.** One redirect: "for decisions, follow recommendations."

## 6. Findings

| ID | Finding | Disposition |
|----|---------|-------------|
| F1 | 22 actions accepted absent required parameters and wrote `undefined` records | Resolved (P1) |
| F2 | Three actions returned raw exception text | Resolved (P1) |
| F3 | Three resource projections could emit a nameless entry | Resolved (P1) |
| F4 | `[MISSING_PARAM]` was specified and never emitted | Resolved (P1) |
| F5 | T177 asserted the opposite of its own row | Resolved (P1) |
| F6 | `status` presented a dry run as a publish | Resolved (P2) |
| F7 | Two moderate `hono` advisories had no disposition | Resolved (P2, documented) |
| F8 | A review-register section pointed at rows that were gone | Resolved (P2) |
| F9 | The mutation sample (8) is too small to evidence sensitivity | **Scheduled** — needs new lens design, not a parameter change |
| F10 | §10 independent verification never run | **Scheduled** — operator step, post-publish |
| F11 | Container image unverified locally | Accepted risk (P2, recorded) |
| F12 | Plan over-scoped P3-T1 | Recorded; rescoped to F9 |

Residual project action items: F9 (P2, scheduled) and F10 (P1, operator). Both
are named here and tracked on ROADMAP; the AAR does not restate them as
recommendations.

Skill findings: recurrence of SK-18 (`changelog-before-commit` not loaded before
authoring the CHANGELOG entry). No duplicate row appended — the register records
repeated misses of one gap in the run log, not as duplicate records. Run
`skill-improvement-loop` to triage.

## 7. Auto-remediation

Not requested. Report only. P4 remains blocked on the operator's explicit order.

## 8. Invocation audit

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `build-review` | yes | routed |
| `independent-review` (via `review` subagent) | yes | routed |
| `after-action-report` | yes | routed |
| `changelog-before-commit` | no | miss (recurrence of SK-18; no new row) |

Invocation: 6 expected, 5 loaded, 1 miss.

LOOP OPEN
