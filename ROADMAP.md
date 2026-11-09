# Roadmap

<!--
  Admission rule: a `## <title>` section is a scheduled work item. It needs an
  action a maintainer can take, 1–3 bullet lines, and a `**Trigger:**` line
  naming what starts the work or what closes it. Priority order, P0 first;
  remove a section when the work ships (it moves to CHANGELOG.md).

  Standing facts are not roadmap items: accepted tradeoffs, by-design
  limitations, and out-of-scope tracks are recorded in `holonovel/DECISIONS.md`,
  and `## Non-goals` is the pointer to them. `npm run check-roadmap` enforces
  this rule; `## Non-goals` is exempt.
-->

## Remaining full-review sweep (P1)

- Chunks P2–P4: tool surface and §5.3; mutation, decision, and lifecycle
  handlers against §5.4/§5.6; `core/state.ts` persistence with the §5.19
  guardrail cross-check.
- Chunks P5–P7: engine loop and event stream (§5.20, §5.24, §5.31); adapters and
  rulesets (§5.10, §5.11, §5.13, §5.15–§5.18, §5.21–§5.23); determinism and
  knowledge (§5.2, §5.7, §5.8, §5.14, §5.28–§5.30).
- Chunk P8 and M1: narrative cognition (§5.12, §5.25–§5.27, §5.32–§5.35) and a
  closing machine-evidence re-run. Scope is §5.1–§5.35 except §5.9 and §5.19,
  which the 2026-11-09 seam pass closed; chunk P1 (trust core, §5.1/§5.5)
  landed the same day.

**Trigger:** the next session allocated to review work, starting with chunk P2
(tool surface and §5.3); closes when chunks P2–P8 and the closing M1 pass
report.

## Trust-core contract remediation (P1)

- Error envelope normalization: refusals return `[ERROR] [FORBIDDEN]` with a
  standalone `Corrective action:` line, every error carries a structured
  result including the valid values, the SDK `-32602` re-label is removed, and
  the `RAW` status is replaced by a declared one (REQ-001, REQ-002, REQ-002b1,
  REQ-548a, REQ-548b, REQ-548c; F-P1-1, F-P1-2, F-P1-3, F-P1-10, F-P1-11).
- Output and authorization surface: truncate every tool result by byte length,
  badge-filter `output://`, gate badge class in the dispatcher, and make
  `tools/list`, `prompts/list`, and `resources/list` the read-only subset
  (REQ-004, REQ-179a, REQ-180b, REQ-031a, REQ-032a, REQ-137b; F-P1-5, F-P1-6,
  F-P1-7, F-P1-8, F-P1-9).
- Audit durability and badge truth: refuse before mutating when the log is at
  capacity, record old and new badge on a switch, and make `set_badge` fail
  when no Novel is active instead of reporting success (REQ-040a, REQ-040c,
  REQ-447, REQ-030, REQ-066b; F-P1-4, F-P1-12, F-P1-13).

**Trigger:** the first session that takes remediation work instead of a review
chunk; closes when the §5.1/§5.5 findings in `spec/audit/review-register.md` are
`Resolved` and their assertions run in a harness.

## Trust-core citation repair (P1)

- Five §5.1/§5.5 REQs cite `Automated` tests that no harness implements
  (REQ-001b2 → T180, REQ-032b → T44, REQ-109f → T109/T110, REQ-286c → T336,
  REQ-306e → T350): write each assertion or re-point the citation to the test
  that exercises the behaviour, then refresh the coverage register.

**Trigger:** the same session as the remediation above, or the next one if that
session reaches its cap; closes when all five citations resolve to an exercised
harness.

## Holosuite anchor repoint automation (P2)

- Add a fix mode to the evidence-anchor tooling (`npm run fix-anchors` or
  `holosuite --fix-anchors`) that content-matches a stale
  `path:line#symbol` predicate to its current line and rewrites it, instead of
  the manual repoints recorded at `2026-10-24`, roadmap-clearance F2, and
  `d92b8f0`.
- Keep the check strict and the fix conservative: `--check` still fails on a
  stale anchor, only the fix mode writes, and it refuses to guess when a
  symbol has no unique content match (REQ-141m).

**Trigger:** the next `holonovel/src/index.ts` or `holonovel/src/core/state.ts`
edit that drifts a predicate, closing when the four manual-repoint sessions no
longer need hand-editing.

## Non-goals

Authoritative list and rationale: `holonovel/DECISIONS.md` § Non-goals.
