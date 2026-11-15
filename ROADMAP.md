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

**Trigger:** the next allocated review session takes U4 (verification workflows and
CI); each chunk closes when its findings are dispositioned, and this section
closes when U8 is `Resolved`.

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
