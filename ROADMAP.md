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

## §5.6 clock and combat-report remediation (P1)

- T161 evidence: the combat turn report must show a weapon-damage mutation
  against a target's HP (REQ-043f), which needs the damage-resolution surface
  from *REQ-124 NPC damage resolution* below; T131 and T161 close together.

**Trigger:** the next §5.6 or ruleset-damage session; closes when T161 resolves
to an exercised harness. T271, T54, T139, T110, and T162 resolve as of the
2026-11-13 increment; T25 and T33 are re-pointed off REQ-043f.

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

## REQ-124 NPC damage resolution (P1)

- Implement the NPC damage path REQ-124a/b describe: a damage-resolution call
  carrying `target_id` reduces the NPC's ruleset HP, zero HP applies the
  ruleset's incapacitation convention, and the result is audited and
  snapshot-able; then write the T131 and T161 assertions (both catalogue rows
  currently have no harness) and mark F-P3B2-15 `Resolved` in the review
  register. T161 is the §5.6 clock/combat-report section's last open citation.
- Decide whether the surface is a host-side consequence applied by the bound
  ruleset's roll tool or an explicit `manage_combat` action, and record the
  choice in `holonovel/DECISIONS.md`.

**Trigger:** the next combat- or ruleset-surface session; closes when T131 and
T161 exercise the HP-reduction and incapacitation branches against a fixture
ruleset (REQ-124a, REQ-124b).

## Unscoped-surface review sweep (P2)

- Foundations through verification: review §1–§4 and Appendices A/M against the
  validator surface (U1), §6 and the build-phase map against the build/update
  tooling and git hooks (U2), §7 and `docs/engine-contract.md` §1/§7–§10 against
  the adapter and server code (U3), and §8 against the gate manifest and CI (U4).
- Artifacts, synthesis, and catalogues: review §9/§10 and Appendix V against the
  publication pipeline (U5), §11 and Appendices B/C/N/W–Z against the fixtures
  and playability harness (U6), and Appendices D–L/O–T/U against the registries
  and manifests (U7).
- Repo governance and content: review the README, AGENTS, SECURITY, package, and
  Docker surface plus the vendored world model and ruleset content (U8), recording
  every finding in `spec/audit/review-register.md` with the same P0–P3
  dispositions as the 2026-11-09 sweep.

**Trigger:** the next allocated review session takes U1 (foundations and
constitution); each chunk closes when its findings are dispositioned, and this
section closes when U8 is `Resolved`.

## Harness test-ID label hygiene (P2)

- Enumerate the zero-padded tokens in the server harness titles that are absent
  from Appendix F (`T020`, `T022`, `T002`, and the rest of the `T0nn` set),
  correct each to the catalogue ID its assertion implements, and re-run the
  coverage resolution — the padded tokens shadow real IDs and produced a false
  citation match for REQ-023b.
- Resolve duplicated test IDs across harnesses: `T408`–`T412` are titled by
  different assertions in `test-narrative`, `test-backfill`, and `test-limits`,
  so a token-presence match can evidence a REQ with the wrong test (REQ-073,
  REQ-075, REQ-077, REQ-083, REQ-233, REQ-236, REQ-246, REQ-289, REQ-357,
  REQ-358, REQ-359, REQ-360, REQ-361).

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
