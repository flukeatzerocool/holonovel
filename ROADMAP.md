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

## Vendor-manifest source provenance (P1)

- Add a `source_url` column to `holonovel/narrative_world_model/MANIFEST.md` for
  the eight vendored sources and extend `check-vendor-manifest` to require a
  non-empty, well-formed URL per row, so Appendix U's admission rule (c) has a
  predicate instead of a prose duty (U7-F4).

**Trigger:** the next allocated content-provenance session; closes when the
manifest carries the column, the checker enforces it, and U7-F4 is `Resolved`.

## Harness test-ID label hygiene (P2)

- The residual from the 2026-11-09 full-review sweep's chunk P2 (F-P2-4): a
  harness comment at `holonovel/scripts/test-narrative.ts:1205` names `T056`, a
  zero-padded ID Appendix F does not define, beside the real `T723`. Correct the
  label, then grep the harness corpus for zero-padded IDs and record the result.

**Trigger:** the next harness-maintenance session; closes when the comment
carries only real Appendix F IDs and the corpus grep is recorded.

## Non-goals

Authoritative list and rationale: `holonovel/DECISIONS.md` § Non-goals.
