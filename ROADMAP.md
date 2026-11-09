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

- Chunks P3b-2 (entities and NPCs, 93 REQs), P3b-3 (adventure content, 39), and
  P3b-4 (state surfaces and fingerprinting, 67).
- Chunks P4 (`core/state.ts` persistence with the §5.19 cross-check) and P5–P7
  (engine loop and event stream; adapters and rulesets; determinism and
  knowledge).
- Chunk P8 (narrative cognition) and the closing M1 machine-evidence re-run.
  Scope is §5.1–§5.35 except §5.9 and §5.19, which the 2026-11-09 seam pass
  closed; P3b-1 (core state and lifecycle) closed 2026-11-09.

**Trigger:** the next session allocated to review work, starting with chunk P3b-2
(§5.6 entities and NPCs); closes when chunks P3b-2–P8 and the closing M1 pass
report.

## §5.6 core state and lifecycle remediation (P1)

- Structured recap payload: emit the typed fields REQ-072b/c1/c2/d and
  per-combat confrontation objects REQ-175a/b, and widen T214/T215/T072
  (F-P3B1-3).
- Condition and audit contracts: allow a Player to apply or remove conditions on
  their own active entity and audit both actions (REQ-217b, REQ-217c), record old
  and new badge on a switch (REQ-040c), audit snapshot truncation (REQ-041b), and
  audit vow mutations (REQ-040a) (F-P3B1-4, F-P3B1-5).
- Clock and vow surfaces: expose `clock_type` and the racing/linked/tug_of_war/
  retreat models (REQ-073a1/a2), derive the combat turn report from the audit log
  with `[auto]` (REQ-043b/c), gate vow resolve and remove linked countdowns
  (REQ-289c, REQ-322b/d) (F-P3B1-6–F-P3B1-8); repair the citations for REQ-040d,
  REQ-043f, REQ-072f, REQ-073a2, REQ-073c3, and REQ-289e (F-P3B1-9).

**Trigger:** the first session that takes §5.6 remediation work; closes when
F-P3B1-3–F-P3B1-9 are `Resolved` in the review register.

## §5.4 remediation (P1)

- Record the end-Novel disposal in the audit log before the Novel file moves to
  `.trash` (REQ-140; F-P3-5).
- Carry the ruleset source on each creation equipment entry and omit the field
  when the ruleset defines no starting equipment (REQ-152a, REQ-152b; F-P3-6).
- Surface a named creation error when a declared formula fails to evaluate, and
  add a ruleset-backed creation fixture so the drain-atomicity branch is
  asserted in-tree (REQ-399b, REQ-190; F-P3-7, F-P3-9).

**Trigger:** the next session that takes §5.4 remediation work; closes when
F-P3-5, F-P3-6, F-P3-7, and F-P3-9 are `Resolved` in the review register.

## §5.4 citation repair (P1)

- Write the T103 assertion (character creation undo: step-by-step and quick
  creation, undo blockage during a pending `[NEED_INPUT]`, empty-stack
  `[STATE_CONFLICT]`) or re-point REQ-104c to the harness that exercises it;
  then refresh the coverage register.

**Trigger:** the next citation-remediation session, or the same session as the
§5.4 remediation above; closes when REQ-104c's citation resolves to an exercised
harness and F-P3-8 is `Resolved`.


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

## §5.3 citation repair (P1)

- Write the T22 prompt-registration assertion (REQ-023a/REQ-023b) and the T35
  fixture-isolation assertion (REQ-024a), or re-point them to a harness that
  exercises the stated behaviour; REQ-078a and REQ-078d already have T124 and
  need only a citation re-point.
- Re-point the nine stale citations REQ-025a/b1/b2/c → T45/T154/T165/T166/T170,
  REQ-138a/b → T167, REQ-139 → T168, REQ-057a/b → T40, each already exercised
  under T105/T486/T487/T488, T152, T153, and T39; then refresh the coverage
  register.

**Trigger:** the next session that takes citation-remediation work; closes when
every §5.3 Check citation resolves to an exercised harness and
`spec/audit/review-register.md` marks F-P2-1–F-P2-3 `Resolved`.

## Harness test-ID label hygiene (P2)

- Enumerate the zero-padded tokens in the server harness titles that are absent
  from Appendix F (`T020`, `T022`, `T002`, and the rest of the `T0nn` set),
  correct each to the catalogue ID its assertion implements, and re-run the
  coverage resolution — the padded tokens shadow real IDs and produced a false
  citation match for REQ-023b.

**Trigger:** the next harness-maintenance session, or any session whose
citation resolution reports an unexpected hold; closes when no harness title
carries an ID absent from Appendix F.

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
