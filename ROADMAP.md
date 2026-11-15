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

## Faction knowledge on secrets (P2)

- Let a secret name a faction in its `known_by` list: extend `manage_lore (action:
  set_secret)` with an optional `known_by` array and accept faction ids in
  `manage_lore (action: reveal)`, so §11.2 rule 6's shared-secret tension branch
  is reachable through the tool surface (U6-F5 residual).

**Trigger:** the next lore-surface session; closes when rule 6's shared-secret
branch is exercisable by a harness assertion and the register row is updated.

## Loop-gate fix-up rate re-measurement (P2)

- Two weeks after the AAR close gate ships (2026-11-28), re-measure the fix-up
  rate: pair consecutive commits within 15 minutes and count pairs sharing a
  touched path. Baseline 2026-11-08→14: 26 pairs, 15 sharing. Target: ≤7 of
  the next 26.
  Command: `git log --since=<anchor> --format='%H|%ci|%s' --name-only`.
  If unchanged, the gate did not fix the ordering — reopen the diagnosis.

**Trigger:** the date 2026-11-28, or 26 new commits, whichever comes first;
closes when the re-measurement is recorded in the AAR of that session.

## Vendor-manifest source provenance (P1)

- Add a `source_url` column to `holonovel/narrative_world_model/MANIFEST.md` for
  the eight vendored sources and extend `check-vendor-manifest` to require a
  non-empty, well-formed URL per row, so Appendix U's admission rule (c) has a
  predicate instead of a prose duty (U7-F4).

**Trigger:** the next allocated content-provenance session; closes when the
manifest carries the column, the checker enforces it, and U7-F4 is `Resolved`.

## Non-goals

Authoritative list and rationale: `holonovel/DECISIONS.md` § Non-goals.
