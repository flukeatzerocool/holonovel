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

U7 is next (reference appendices and registries), then U8.

**Trigger:** the next allocated review session takes U7; each chunk closes when
its findings are dispositioned, and this section closes when U8 is `Resolved`.

## Synthesis-surface gaps (P1)

- Implement the synthesis fingerprint: a root hash over the ruleset content hash,
  the synthesis intake answers, and the Novel state hash, plus per-module hashes,
  so a re-run against an unchanged fingerprint is a no-op and partial refresh
  preserves unchanged modules (U6-F3).
- Render the `[LOW]` provenance tag in `badge_briefing` and in synthesis resource
  output, and carry it through every badge view (U6-F4).
- Extend internal synthesis to the remaining category rules — lore templates,
  narrative voices, adventure advice, factions/secrets, countdowns, rooms/things —
  and enforce the per-pass and total-Novel caps (U6-F5).

**Trigger:** the next allocated synthesis-surface session; closes when all three
findings are `Resolved`.

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
