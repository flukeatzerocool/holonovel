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

## Verification-surface reachability (P1)

- Wire the 56-command server suite into a running surface: `test:all`
  (`holonovel/scripts/run-test-suite.ts`) carries the Pattern Buffer (I1–I18,
  S1–S37) and `test:harness-guard`, and appears in no gate, CI step, or hook, so
  §8 G5's blocking sub-workflows and G6's re-run rule are unscheduled.
- Wire the two orphan harnesses: `test:loop-artifacts` (the `check-loop-artifacts`
  self-test) and `test:holosuite-mutation` (the only producer of the catch rate
  §8 makes a precondition for Understudies evidence); the first also declares
  `[informational]` while exiting non-zero on failure.

**Trigger:** the next harness-maintenance session, or any session that changes
`holonovel/scripts/test-*.ts`; closes when each of the three runs in a gate, CI,
or a hook and the role header matches the exit behaviour.

## G7 attestation predicate (P1)

- Replace the self-attesting G7 disposition: `G7_ATTESTATION_RECORDED = true`
  (`holonovel/src/index.ts:384`) and a 31-family list cannot evidence "every
  narrative-critical REQ" when §5.12 carries 84 REQ bodies; derive the list from
  §5.12 and read the attestation block instead of the literal, so the
  disposition can report `partial` or `fail`.
- Keep `spec_health.narrative_coherence` shape-compatible: `implemented`,
  `total`, `disposition`, and `reqs` are consumed by the G7 evidence record and
  the coverage register (REQ-346).

**Trigger:** the next `holonovel/src/index.ts` narrative-surface edit; closes
when removing the literal makes the disposition change, proven by a harness case
that forces `partial`.

## Verification evidence record and the CI-manifest split (P2)

- Bring the G7 evidence block up to §8's seven fields (workflow name, timestamp,
  environment pins, commands and output, pass/fail, findings) in
  `holonovel/DECISIONS.md`; today it carries three lettered attestations and a
  `spec_health` bullet.
- Decide and record the CI↔manifest split: the `gates` job runs 15 commands the
  manifest does not hold, so `check:fast` green does not imply CI green and
  `gate-cost-report` cannot see those costs; either wire the ones that fit or
  state the split in `AGENTS.md`.

**Trigger:** the next `AGENTS.md` or `holonovel/DECISIONS.md` maintenance
session; closes when the record carries all seven fields and the split is either
wired or documented.

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

**Trigger:** the next allocated review session takes U5 (artifacts, independent
verification, cadence, publication); each chunk closes when its findings are
dispositioned, and this section closes when U8 is `Resolved`.

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

## Loop-gate fix-up rate re-measurement (P2)

- Two weeks after the AAR close gate ships (2026-11-28), re-measure the fix-up
  rate: pair consecutive commits within 15 minutes and count pairs sharing a
  touched path. Baseline 2026-11-08→14: 26 pairs, 15 sharing. Target: ≤7 of
  the next 26.
  Command: `git log --since=<anchor> --format='%H|%ci|%s' --name-only`.
  If unchanged, the gate did not fix the ordering — reopen the diagnosis.

**Trigger:** the date 2026-11-28, or 26 new commits, whichever comes first;
closes when the re-measurement is recorded in the AAR of that session.

## Non-goals

Authoritative list and rationale: `holonovel/DECISIONS.md` § Non-goals.
